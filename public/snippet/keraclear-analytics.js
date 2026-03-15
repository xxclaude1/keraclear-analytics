/**
 * KeraClear Analytics — Tracking Snippet
 * Injected into Shopify store via <script async src="..."></script> in theme.liquid
 * < 15KB gzipped, non-blocking, first-party cookies only
 */
(function () {
  'use strict';

  // ========================================
  // CONFIGURATION
  // ========================================
  var ENDPOINT = '{{ANALYTICS_ENDPOINT}}'; // replaced at deploy or set below
  var BATCH_INTERVAL = 5000; // send events every 5 seconds
  var SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min inactivity = new session
  var COOKIE_EXPIRY = 365; // visitor cookie lasts 1 year
  var COOKIE_NAME = '_kca_vid';
  var SESSION_COOKIE = '_kca_sid';
  var CART_FLAG_KEY = '_kca_atc';
  var CHECKOUT_FLAG_KEY = '_kca_co';
  var RECORDING_INTERVAL = 10000; // send recording chunks every 10 seconds
  var RRWEB_CDN = 'https://cdn.jsdelivr.net/npm/rrweb@2.0.0-alpha.17/dist/rrweb-all.umd.cjs';

  // Auto-detect endpoint from script src if not hardcoded
  var BASE_ORIGIN = '';
  if (ENDPOINT === '{{ANALYTICS_ENDPOINT}}' || !ENDPOINT) {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('keraclear-analytics.js') !== -1) {
        var url = new URL(src);
        BASE_ORIGIN = url.origin;
        ENDPOINT = BASE_ORIGIN + '/.netlify/functions/ingest';
        break;
      }
    }
  }

  if (!ENDPOINT) return;
  var RECORDINGS_ENDPOINT = BASE_ORIGIN + '/.netlify/functions/recordings';

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  function generateId() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = '';
    for (var i = 0; i < 20; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return Date.now().toString(36) + id;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) +
      ';expires=' + d.toUTCString() +
      ';path=/;SameSite=Lax';
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function getOrCreateVisitorId() {
    var id = getCookie(COOKIE_NAME);
    if (!id) {
      id = 'v_' + generateId();
      setCookie(COOKIE_NAME, id, COOKIE_EXPIRY);
    }
    return id;
  }

  function getOrCreateSessionId() {
    var id = getCookie(SESSION_COOKIE);
    if (!id) {
      id = 's_' + generateId();
    }
    // Refresh session cookie on every activity
    setCookie(SESSION_COOKIE, id, 0.02); // ~30 min
    return id;
  }

  function isNewSession() {
    return !getCookie(SESSION_COOKIE);
  }

  // ========================================
  // DEVICE & BROWSER DETECTION
  // ========================================

  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    return 'Other';
  }

  function getOS() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'macOS';
    if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    return 'Other';
  }

  function getScreenResolution() {
    return screen.width + 'x' + screen.height;
  }

  // ========================================
  // UTM & REFERRER PARSING
  // ========================================

  function getUTMParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_content: params.get('utm_content') || null,
      utm_term: params.get('utm_term') || null,
    };
  }

  function getReferrer() {
    var ref = document.referrer;
    if (!ref) return null;
    try {
      var refHost = new URL(ref).hostname;
      // Don't count same-site as referrer
      if (refHost === window.location.hostname) return null;
      return ref;
    } catch (e) {
      return ref;
    }
  }

  // ========================================
  // EVENT QUEUE & BATCHING
  // ========================================

  var eventQueue = [];
  var visitorId = getOrCreateVisitorId();
  var newSession = isNewSession();
  var sessionId = getOrCreateSessionId();
  var utmParams = getUTMParams();
  var referrer = getReferrer();
  var sessionStarted = newSession;
  var currentPageUrl = window.location.pathname + window.location.search;
  var pageEnteredAt = Date.now();

  function queueEvent(eventType, eventData) {
    eventQueue.push({
      event_type: eventType,
      event_data: eventData || {},
      page_url: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
    });
  }

  function flushEvents() {
    if (eventQueue.length === 0) return;

    var payload = {
      visitor_id: visitorId,
      session_id: sessionId,
      is_new_session: sessionStarted,
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      screen_resolution: getScreenResolution(),
      referrer: referrer,
      utm: utmParams,
      events: eventQueue.splice(0), // take all and clear
    };

    // After first flush, no longer a new session
    sessionStarted = false;

    // Use sendBeacon for reliability (works on page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, JSON.stringify(payload));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(payload));
    }
  }

  // Flush every BATCH_INTERVAL ms
  var flushTimer = setInterval(flushEvents, BATCH_INTERVAL);

  // ========================================
  // PAGE VIEW TRACKING
  // ========================================

  function trackPageView() {
    var path = window.location.pathname;
    var url = path + window.location.search;

    queueEvent('page_view', {
      page_url: url,
      page_title: document.title,
      referrer: document.referrer || null,
    });

    // Detect funnel events based on URL patterns
    // Landing page = first page of session
    if (sessionStarted) {
      queueEvent('landing_page_view', { page_url: url });
    }

    // VSL page detection
    if (path.indexOf('/pages/vsl') !== -1 ||
        path.indexOf('/pages/video') !== -1 ||
        path.indexOf('vsl') !== -1) {
      queueEvent('vsl_page_view', { page_url: url });
    }

    // Sales / product page detection
    if (path.indexOf('/products/') !== -1) {
      queueEvent('sales_page_view', {
        page_url: url,
        product: path.split('/products/')[1] || '',
      });
    }

    // Checkout initiated detection
    if (path.indexOf('/checkout') !== -1 ||
        path.indexOf('/checkouts/') !== -1) {
      sessionStorage.setItem(CHECKOUT_FLAG_KEY, '1');
      queueEvent('checkout_initiated', { page_url: url });
    }

    // Checkout completed (thank you / order confirmation)
    if (path.indexOf('/thank_you') !== -1 ||
        path.indexOf('/thank-you') !== -1 ||
        path.indexOf('/orders/') !== -1 ||
        (path.indexOf('/checkout') !== -1 && path.indexOf('thank_you') !== -1)) {
      sessionStorage.removeItem(CART_FLAG_KEY);
      sessionStorage.removeItem(CHECKOUT_FLAG_KEY);
      queueEvent('checkout_completed', { page_url: url });
    }

    // Update current page tracking
    currentPageUrl = url;
    pageEnteredAt = Date.now();
  }

  // Track initial page view
  trackPageView();

  // ========================================
  // ADD TO CART DETECTION
  // ========================================

  // Method 1: Intercept fetch calls to /cart/add.js
  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function () {
      var url = arguments[0];
      var urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');

      if (urlStr.indexOf('/cart/add') !== -1) {
        sessionStorage.setItem(CART_FLAG_KEY, '1');
        // Try to extract product info from the request body
        var opts = arguments[1] || {};
        var productData = {};
        if (opts.body) {
          try {
            if (typeof opts.body === 'string') {
              productData = JSON.parse(opts.body);
            }
          } catch (e) { /* ignore parse errors */ }
        }
        queueEvent('add_to_cart', {
          page_url: window.location.pathname,
          product_data: productData,
        });
      }

      return originalFetch.apply(this, arguments);
    };
  }

  // Method 2: Intercept XMLHttpRequest to /cart/add.js
  var originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    var method = arguments[0];
    var url = arguments[1] || '';

    if (url.indexOf('/cart/add') !== -1) {
      this._kcaCartAdd = true;
    }

    return originalXHROpen.apply(this, arguments);
  };

  var originalXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    if (this._kcaCartAdd) {
      sessionStorage.setItem(CART_FLAG_KEY, '1');
      var productData = {};
      if (body) {
        try {
          productData = JSON.parse(body);
        } catch (e) { /* might be FormData or other format */ }
      }
      queueEvent('add_to_cart', {
        page_url: window.location.pathname,
        product_data: productData,
      });
    }
    return originalXHRSend.apply(this, arguments);
  };

  // Method 3: Listen for form submissions to /cart/add or /cart
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var action = form.getAttribute('action') || '';
    if (action.indexOf('/cart/add') !== -1 || action.indexOf('/cart') !== -1) {
      sessionStorage.setItem(CART_FLAG_KEY, '1');
      queueEvent('add_to_cart', {
        page_url: window.location.pathname,
        form_action: action,
      });
    }
  }, true);

  // ========================================
  // SPA / NAVIGATION TRACKING
  // ========================================

  // Track pushState / replaceState for SPA-like navigation
  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;

  function onNavigation() {
    var newUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentPageUrl) {
      // Track time on previous page
      var timeOnPage = Math.round((Date.now() - pageEnteredAt) / 1000);
      queueEvent('page_exit', {
        page_url: currentPageUrl,
        time_on_page_seconds: timeOnPage,
      });

      currentPageUrl = newUrl;
      pageEnteredAt = Date.now();
      trackPageView();
    }
  }

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    onNavigation();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    onNavigation();
  };

  window.addEventListener('popstate', onNavigation);

  // ========================================
  // ABANDONMENT DETECTION
  // ========================================

  function detectAbandonment() {
    var hadCheckout = sessionStorage.getItem(CHECKOUT_FLAG_KEY);
    var hadCart = sessionStorage.getItem(CART_FLAG_KEY);

    if (hadCheckout) {
      queueEvent('checkout_abandonment', {
        page_url: window.location.pathname,
        time_on_page_seconds: Math.round((Date.now() - pageEnteredAt) / 1000),
      });
    } else if (hadCart) {
      queueEvent('cart_abandonment', {
        page_url: window.location.pathname,
        time_on_page_seconds: Math.round((Date.now() - pageEnteredAt) / 1000),
      });
    }

    // Also send page exit for current page
    queueEvent('page_exit', {
      page_url: currentPageUrl,
      time_on_page_seconds: Math.round((Date.now() - pageEnteredAt) / 1000),
    });

    queueEvent('session_end', {});

    // Flush immediately on unload
    flushEvents();
  }

  // Use both pagehide and beforeunload for maximum coverage
  window.addEventListener('pagehide', detectAbandonment);
  window.addEventListener('beforeunload', detectAbandonment);

  // Visibility change — user switched tabs for extended time
  var hiddenSince = null;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      hiddenSince = Date.now();
    } else if (hiddenSince) {
      var hiddenDuration = Date.now() - hiddenSince;
      hiddenSince = null;

      // If hidden for more than session timeout, treat as new session
      if (hiddenDuration > SESSION_TIMEOUT) {
        detectAbandonment();
        sessionId = getOrCreateSessionId();
        sessionStarted = true;
        trackPageView();
      }
    }
  });

  // ========================================
  // SCROLL DEPTH TRACKING (lightweight)
  // ========================================

  var maxScrollDepth = 0;
  var scrollThresholds = [25, 50, 75, 100];
  var firedThresholds = {};

  function onScroll() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    ) - window.innerHeight;

    if (docHeight <= 0) return;

    var depth = Math.round((scrollTop / docHeight) * 100);
    if (depth > maxScrollDepth) {
      maxScrollDepth = depth;

      for (var i = 0; i < scrollThresholds.length; i++) {
        var t = scrollThresholds[i];
        if (depth >= t && !firedThresholds[t]) {
          firedThresholds[t] = true;
          queueEvent('scroll_depth', {
            depth: t,
            page_url: currentPageUrl,
          });
        }
      }
    }
  }

  // Throttled scroll listener
  var scrollTimeout;
  window.addEventListener('scroll', function () {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(function () {
      scrollTimeout = null;
      onScroll();
    }, 250);
  }, { passive: true });

  // ========================================
  // CLICK TRACKING (key elements only)
  // ========================================

  document.addEventListener('click', function (e) {
    var target = e.target;
    var el = target.closest('a, button, [data-kca-track]');
    if (!el) return;

    var data = {
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || '').substring(0, 100).trim(),
      page_url: currentPageUrl,
    };

    if (el.href) data.href = el.href;
    if (el.className) data.class = (typeof el.className === 'string' ? el.className : '').substring(0, 200);
    if (el.id) data.id = el.id;

    queueEvent('click', data);
  }, true);

  // ========================================
  // SESSION RECORDING (rrweb)
  // ========================================

  var recordingBuffer = [];
  var chunkIndex = 0;

  function sendRecordingChunk() {
    if (recordingBuffer.length === 0) return;

    var chunk = {
      session_id: sessionId,
      visitor_id: visitorId,
      chunk_index: chunkIndex++,
      data: recordingBuffer.splice(0),
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(RECORDINGS_ENDPOINT, JSON.stringify(chunk));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', RECORDINGS_ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(chunk));
    }
  }

  // Load rrweb from CDN and start recording
  function initRecording() {
    var script = document.createElement('script');
    script.src = RRWEB_CDN;
    script.async = true;
    script.onload = function () {
      if (!window.rrweb || !window.rrweb.record) return;

      window.rrweb.record({
        emit: function (event) {
          recordingBuffer.push(event);
        },
        maskAllInputs: true,
        maskTextSelector: '[data-kca-mask]',
        blockSelector: '[data-kca-block]',
        sampling: {
          mousemove: 50,
          mouseInteraction: true,
          scroll: 150,
          media: 800,
          input: 'last',
        },
        recordCanvas: false,
        collectFonts: false,
      });

      // Send recording chunks periodically
      setInterval(sendRecordingChunk, RECORDING_INTERVAL);
    };
    document.head.appendChild(script);
  }

  // Start recording after page is interactive
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initRecording();
  } else {
    window.addEventListener('DOMContentLoaded', initRecording);
  }

  // Flush recording buffer on page unload
  var originalDetectAbandonment = detectAbandonment;
  detectAbandonment = function () {
    sendRecordingChunk();
    originalDetectAbandonment();
  };

})();
