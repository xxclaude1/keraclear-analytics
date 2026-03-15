export const TIME_PERIODS = [
  { label: '1h', value: '1h', ms: 3600000 },
  { label: '6h', value: '6h', ms: 21600000 },
  { label: '12h', value: '12h', ms: 43200000 },
  { label: '24h', value: '24h', ms: 86400000 },
  { label: '7d', value: '7d', ms: 604800000 },
  { label: '30d', value: '30d', ms: 2592000000 },
]

export const FUNNEL_STEPS = [
  { key: 'landing_page_view', label: 'Landing Page' },
  { key: 'vsl_page_view', label: 'VSL Page' },
  { key: 'sales_page_view', label: 'Sales Page' },
  { key: 'add_to_cart', label: 'Add to Cart' },
  { key: 'checkout_initiated', label: 'Checkout' },
  { key: 'checkout_completed', label: 'Purchase' },
]

export const EVENT_COLORS = {
  page_view: '#3b82f6',
  add_to_cart: '#22c55e',
  checkout_initiated: '#eab308',
  checkout_completed: '#22c55e',
  cart_abandonment: '#ef4444',
  checkout_abandonment: '#ef4444',
}

export const ABANDONMENT_TYPES = {
  cart: 'Cart Abandonment',
  checkout: 'Checkout Abandonment',
}
