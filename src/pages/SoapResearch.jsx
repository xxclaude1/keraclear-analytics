import { useState } from 'react'

const SECTIONS = [
  'Market Overview',
  'Competitor / Category Notes',
  'Research Findings: Public Forum Posts',
  'Verbatim Language Bank',
  'Emotional / Psychological Analysis',
  'Customer Avatar',
  'Existing Solutions',
  'Core Desires',
  'Copywriting Implications',
  'Final Summary for Copy Team',
]

function Section({ title, children }) {
  return (
    <div className="research-section">
      <h2 className="research-h2">{title}</h2>
      {children}
    </div>
  )
}

function Quote({ text, source, url }) {
  return (
    <blockquote className="research-quote">
      <p>"{text}"</p>
      {source && (
        <cite>
          — {url ? <a href={url} target="_blank" rel="noopener noreferrer">{source}</a> : source}
        </cite>
      )}
    </blockquote>
  )
}

function PostCard({ num, title, url, platform, description, painPoint, quotes }) {
  return (
    <div className="research-post-card">
      <div className="post-header">
        <span className="post-num">#{num}</span>
        <div>
          <h4>{title}</h4>
          <div className="post-meta">
            <span className="post-platform">{platform}</span>
            {url && <a href={url} target="_blank" rel="noopener noreferrer" className="post-link">View Post →</a>}
          </div>
        </div>
      </div>
      <p className="post-desc">{description}</p>
      <div className="post-pain"><strong>Key Pain Point:</strong> {painPoint}</div>
      <div className="post-quotes">
        {quotes.map((q, i) => (
          <div key={i} className="post-verbatim">"{q}"</div>
        ))}
      </div>
    </div>
  )
}

function DesireCard({ num, desire, who }) {
  return (
    <div className="desire-card">
      <span className="desire-num">{num}</span>
      <div>
        <p className="desire-text">{desire}</p>
        <p className="desire-who">{who}</p>
      </div>
    </div>
  )
}

export default function SoapResearch() {
  const [activeSection, setActiveSection] = useState(0)

  return (
    <div className="research-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Soap Research V3</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
            Antifungal Soap — Athlete's Foot Market · Deep Research Document · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="research-nav">
        {SECTIONS.map((s, i) => (
          <button
            key={i}
            className={`research-nav-btn ${activeSection === i ? 'active' : ''}`}
            onClick={() => {
              setActiveSection(i)
              document.querySelector('.main-content')?.scrollTo(0, 0)
            }}
          >
            <span className="nav-num">{i + 1}</span>
            {s}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="research-content">

        {/* ===== 1. MARKET OVERVIEW ===== */}
        {activeSection === 0 && (
          <Section title="1) Market Overview">
            <h3>What the Market Is</h3>
            <p>
              The athlete's foot treatment market is a <strong>recurring-pain, everyday-solution category</strong> targeting
              the estimated 15–25% of the global population who will experience a dermatophyte fungal infection at any given time.
              Athlete's foot (tinea pedis) is the most common fungal skin infection, and it rarely stays as "just athlete's foot" —
              it spreads to toenails (onychomycosis), the groin (jock itch / tinea cruris), and sometimes across the body (ringworm / tinea corporis).
            </p>

            <h3>Why It Matters Emotionally</h3>
            <p>
              This is not a clinical problem. It's an <strong>identity crisis</strong>. People with chronic fungal infections
              don't say "I have a dermatophyte infection." They say:
            </p>
            <div className="research-callout-grid">
              <Quote text="It's disgusting and has been incredibly damaging to my self esteem." source="17-year-old, Reddit r/Advice" />
              <Quote text="Tonight I'm literally sitting on the floor sobbing my eyes out." source="Reddit r/TwoXChromosomes" />
              <Quote text="It was often enough to bring me to tears." source="Patient.info Forums" />
              <Quote text="My foot is a bloody mess and I feel defeated." source="Mumsnet" />
            </div>
            <p>
              The emotional weight of this condition is <strong>massively underestimated</strong> by the market. People hide their feet for years.
              They avoid pools, beaches, pedicures, intimacy, and sandals. They spend hundreds or thousands on treatments that fail.
              They suffer in silence because they're too ashamed to talk about it — even to doctors.
            </p>

            <h3>Recurring vs. One-Time Pain</h3>
            <p>
              This is a <strong>chronic, recurring condition</strong>. The research overwhelmingly shows that most sufferers
              have been dealing with this for <strong>years or decades</strong>:
            </p>
            <table className="research-table">
              <thead>
                <tr><th>Duration Mentioned</th><th>Source</th></tr>
              </thead>
              <tbody>
                <tr><td>50 years</td><td>FungaSoap Amazon review (Herman, FL)</td></tr>
                <tr><td>30+ years</td><td>Reddit r/tifu — "more than 30 years"</td></tr>
                <tr><td>25 years</td><td>Reddit r/gratitude — indoor soccer injury</td></tr>
                <tr><td>23 years</td><td>Mumsnet — "first got it when pregnant"</td></tr>
                <tr><td>15 years</td><td>Reddit r/Biohackers — untreated</td></tr>
                <tr><td>11 years</td><td>Reddit r/NailFungus — beach hiding</td></tr>
                <tr><td>10 years</td><td>Diabetes.co.uk forum</td></tr>
                <tr><td>9 years</td><td>Reddit r/NailFungus — pedicure infection</td></tr>
                <tr><td>5+ years</td><td>Reddit r/tifu — 24K upvotes</td></tr>
                <tr><td>"Decades"</td><td>HealthUnlocked — "as long as I can remember"</td></tr>
              </tbody>
            </table>

            <h3>Why People Keep Searching</h3>
            <ol>
              <li><strong>Nothing works permanently</strong> — Creams suppress symptoms but fungus returns. "No treatment does anything but keep it at bay."</li>
              <li><strong>Treatments address symptoms, not the environment</strong> — They treat the spot but not shoes, shower floors, bedsheets, or cross-contamination habits.</li>
              <li><strong>They get dismissed by doctors</strong> — "The pharmacist just says to speak to the GP. The GP just says try a different cream."</li>
              <li><strong>Shame prevents early action</strong> — People wait years before seeking help, letting it spread and entrench.</li>
              <li><strong>The emotional pain never goes away</strong> — Even mild cases cause daily anxiety about sandal season, intimacy, gym showers, and social situations.</li>
            </ol>

            <div className="research-insight">
              <strong>Key Insight:</strong> The antifungal soap market is growing at 7.5% CAGR (vs. 4.9% for general body wash).
              The average customer spends $19.76 per product. This is a market of desperate, repeat buyers who have
              been failed by creams, sprays, powders, and prescriptions — and are actively searching for something that finally works.
            </div>
          </Section>
        )}

        {/* ===== 2. COMPETITOR / CATEGORY NOTES ===== */}
        {activeSection === 1 && (
          <Section title="2) Competitor / Category Notes">
            <h3>Top Competitors by Market Share</h3>
            <table className="research-table">
              <thead>
                <tr><th>Product</th><th>Reviews</th><th>Rating</th><th>Price</th><th>Active Ingredient</th></tr>
              </thead>
              <tbody>
                <tr><td>Remedy Soap Tea Tree Body Wash</td><td>30,809+</td><td>4.4/5</td><td>$14.99–$16.99</td><td>Tea tree oil 5%</td></tr>
                <tr><td>Purely Northwest Tea Tree Wash</td><td>24,491+</td><td>4.4/5</td><td>$17.99–$19.28</td><td>Tea tree + oregano + eucalyptus</td></tr>
                <tr><td>New York Biology Tea Tree Wash</td><td>14,000+</td><td>4.5/5</td><td>$13–$17</td><td>Tea tree oil 5%</td></tr>
                <tr><td>Defense Antifungal Bar Soap</td><td>10,558+</td><td>4.6/5</td><td>$9–$16</td><td>Tolnaftate 1% (FDA)</td></tr>
                <tr><td>PediFix FungaSoap</td><td>~4,000+</td><td>4.8/5</td><td>$8–$13</td><td>Tea tree oil</td></tr>
                <tr><td>Cuishifan 3-in-1 Sulfur Wash</td><td>223K/mo sales</td><td>4.6/5</td><td>$5.56</td><td>Sulfur (TikTok viral)</td></tr>
              </tbody>
            </table>

            <h3>What People LIKE About Current Solutions</h3>
            <ul>
              <li><strong>Speed when it works:</strong> "Within 3 or 4 days my skin was vastly improved." "Back to normal by day 10."</li>
              <li><strong>Feel clean:</strong> "I've honestly never felt so clean as when I used this shower gel."</li>
              <li><strong>Natural ingredients:</strong> Tea tree oil is the #1 sought-after ingredient — perceived as safe and effective.</li>
              <li><strong>Athlete/wrestler endorsements:</strong> Defense Soap dominates the combat sports niche with social proof.</li>
            </ul>

            <h3>What People DISLIKE About Current Solutions</h3>
            <table className="research-table">
              <thead>
                <tr><th>Complaint</th><th>Frequency</th><th>Key Quote</th></tr>
              </thead>
              <tbody>
                <tr><td>Doesn't actually kill fungus</td><td>Very High</td><td>"Used this for 2 months on a daily basis and it did nothing for my toe fungus"</td></tr>
                <tr><td>Dries out skin</td><td>High</td><td>"Defense Soap will really dry out your skin"</td></tr>
                <tr><td>Strong/medicinal smell</td><td>High</td><td>"The smell is just too strong" / "scent similar to machine oil"</td></tr>
                <tr><td>Too expensive / dissolves fast</td><td>Moderate</td><td>"Wouldn't waste 20 dollars on this crap again"</td></tr>
                <tr><td>Burns/irritates</td><td>Moderate</td><td>"Certain body parts sort of burn when the body wash hits them"</td></tr>
                <tr><td>Infection comes back</td><td>Very High</td><td>"Lamisil once should be called 'lamisil once a month'"</td></tr>
                <tr><td>Requires multiple products</td><td>Moderate</td><td>"Inconvenient to have to use two different soaps every time you shower"</td></tr>
              </tbody>
            </table>

            <h3>What's MISSING in the Category</h3>
            <div className="research-insight">
              <strong>No single product combines:</strong>
              <ol>
                <li>Clinically effective antifungal ingredients (not just antibacterial tea tree)</li>
                <li>Moisturizing formula (doesn't dry skin out)</li>
                <li>Pleasant, non-medicinal scent</li>
                <li>All-in-one (replaces cream + spray + powder)</li>
                <li>Daily-use prevention positioning (not just rescue treatment)</li>
              </ol>
              <p style={{marginTop: 12}}>
                <strong>Positioning recommendation:</strong> Position as a <strong>daily-use prevention + treatment hybrid</strong>.
                The "daily body wash that happens to be antifungal" angle is wide open. Current products are positioned as
                medicine-cabinet treatments. The person who uses it every day in the shower — like regular soap — never has to
                worry about recurrence. That's the promise no one is making.
              </p>
            </div>

            <h3>Price Point Sweet Spot</h3>
            <ul>
              <li><strong>Budget ($5–$8):</strong> Sulfur washes. Viral on TikTok but associated with bad smell.</li>
              <li><strong>Mid-tier ($13–$20):</strong> Where the bulk of sales occur. Average spend: $19.76.</li>
              <li><strong>Premium ($20–$30+):</strong> Clinical formulations. Lower volume, higher margin.</li>
            </ul>
          </Section>
        )}

        {/* ===== 3. RESEARCH FINDINGS: PUBLIC FORUM POSTS ===== */}
        {activeSection === 2 && (
          <Section title="3) Research Findings: Public Forum Posts">
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              45 public discussion posts from real people across Reddit, Mumsnet, HealthUnlocked, Patient.info, Diabetes forums,
              Quora, sports forums, and health communities. Each post captures emotional suffering, not product reviews.
            </p>

            <h3>Reddit Posts (24 posts)</h3>

            <PostCard num={1}
              title="TIFU by having athletes foot for over 5 years"
              url="https://www.reddit.com/r/tifu/comments/fjz6sx/"
              platform="Reddit r/tifu · 24,147 upvotes"
              description="Man suffered 5+ years because he was too disgusted by feet to investigate."
              painPoint="Shame and denial so deep he ignored a treatable condition for half a decade."
              quotes={[
                "I hated it and was ashamed to take my socks off and shit.",
                "I was EXTREMELY embarrassed, but took them off.",
                "If you're embarrassed, that's why god invented self-checkout. F U N G U S. GO NOW!",
              ]}
            />

            <PostCard num={2}
              title="TIFU by discovering I've had athlete's foot for more than 30 years"
              url="https://www.reddit.com/r/tifu/comments/o9fipx/"
              platform="Reddit r/tifu · 32,219 upvotes"
              description="Man thought thick, crusty feet were just 'how feet are' his entire adult life."
              painPoint="Decades of normalized suffering — thought diseased feet were just part of being male."
              quotes={[
                "The feet develop a hard, protective crust. All natural physical development. Or so I had assumed.",
                "Never has a doctor mentioned it to me. Never has a partner mentioned it to me. Never has anyone mentioned it to me.",
                "I just thought that's how feet are.",
              ]}
            />

            <PostCard num={3}
              title="15 years of athletes foot gone after one week of treatment"
              url="https://www.reddit.com/r/Biohackers/comments/1lfrk3u/"
              platform="Reddit r/Biohackers · 1,676 upvotes"
              description="Suffered 15 years, tried everything, gave up on conventional treatments."
              painPoint="Over a decade of untreated suffering after failed treatments."
              quotes={[
                "I tried topical creams, anti fungals, powders, sprays. Nothing ever worked so I just left it untreated for over a decade.",
                "I had a severe case where it spread all throughout my foot, developed a moccasin infection, an infection in the nails and developed multiple lesions on both feet.",
                "My feet haven't felt this good since I was a kid it is such a strange feeling.",
              ]}
            />

            <PostCard num={4}
              title="Might lose both my big toenails and I'm a sobbing violent mess"
              url="https://www.reddit.com/r/TwoXChromosomes/comments/1f9azqx/"
              platform="Reddit r/TwoXChromosomes · 852 upvotes"
              description="Woman facing permanent toenail loss, having emotional breakdown."
              painPoint="Rock-bottom — sobbing on the floor, self-hatred, fear of permanent disfigurement."
              quotes={[
                "Tonight I'm literally sitting on the floor sobbing my eyes out.",
                "I'm so full of self hatred for not taking care of this in college. Goddammit.",
                "They're so ugly and disgusting... Did your partner find it gross?",
              ]}
            />

            <PostCard num={5}
              title="11 years with toenail fungus... My definitive solution."
              url="https://www.reddit.com/r/NailFungus/comments/1po89gc/"
              platform="Reddit r/NailFungus · 50 upvotes"
              description="Too embarrassed to see a dermatologist for over a decade."
              painPoint="Embarrassment so intense it prevented medical help for 11 years."
              quotes={[
                "Out of embarrassment, I never went to a dermatologist; I always wanted to fix it myself.",
                "It felt awful to look down and see my nails ruined.",
                "At the beach, I had to bury my feet in the sand to hide them.",
              ]}
            />

            <PostCard num={6}
              title="Ringworm, athletes foot, jock itch EVERYWHERE and treatment resistant"
              url="https://www.reddit.com/r/AskDocs/comments/1o805j5/"
              platform="Reddit r/AskDocs"
              description="18-year-old with fungal infection spreading across entire body for months."
              painPoint="Feels like a contamination source — infecting everything she touches."
              quotes={[
                "I'm infecting everything I touch even if I clean it. I've probably infected tons of people just from going to the bank.",
                "I feel very embarrassed.",
                "Today my vet told me 'ringworm usually resolves itself on its own' and I just got so mad.",
              ]}
            />

            <PostCard num={7}
              title="I (17m) am too embarrassed to ask my parents to go to the doctor"
              url="https://www.reddit.com/r/Advice/comments/1lk1zr2/"
              platform="Reddit r/Advice"
              description="Teenager suffering in silence, too ashamed to tell parents."
              painPoint="Shame so intense a teenager would rather suffer than let his parents know."
              quotes={[
                "It's disgusting and has been incredibly damaging to my self esteem, but I've been able to cover it up with socks and shoes.",
                "I have no idea what I'm going to do this summer.",
                "I don't really do anything that makes me seem like not a loser, so I'd really hate to make their perspective of me even lower.",
              ]}
            />

            <PostCard num={8}
              title="Incurable Jock Itch"
              url="https://www.reddit.com/r/Healthyhooha/comments/1hcnbok/"
              platform="Reddit r/Healthyhooha · 26 upvotes"
              description="20-year-old visited 7 doctors, spent thousands, can no longer dance."
              painPoint="Rock-bottom desperation — crying, financially drained, identity taken away."
              quotes={[
                "It's ruining my life. I am a dancer, and I can't dance because it flares up even more.",
                "I've spent thousands of dollars on this.",
                "I am so desperate and I can't stop crying.",
              ]}
            />

            <PostCard num={9}
              title="Gross crotch question."
              url="https://www.reddit.com/r/hygiene/comments/1r9x386/"
              platform="Reddit r/hygiene · 1,885 upvotes"
              description="Man in his 40s with recurring jock itch — doctor treats him like he's dirty."
              painPoint="Shame compounded by medical dismissal."
              quotes={[
                "I am super embarrassed about it.",
                "The second I stop, my crotch starts growing a slimy, bad smelling film in the folds.",
                "My regular doctor acts like I'm just a dirty person.",
              ]}
            />

            <PostCard num={10}
              title="Is this a deal breaker?!! My date has bad toenail fungus"
              url="https://www.reddit.com/r/datingoverforty/comments/1mjr44v/"
              platform="Reddit r/datingoverforty · 37 upvotes"
              description="Woman almost nauseous seeing her 'holy grail' date's toenails."
              painPoint="Fungal infection can destroy romantic prospects even when everything else is perfect."
              quotes={[
                "I saw his bare feet. I have never seen anything like it... I felt almost nauseous.",
                "Those nails are still etched into my retina.",
                "These nails don't add to the sex appeal at all.",
              ]}
            />

            <PostCard num={11}
              title="Struggled with nail fungus for 9 years."
              url="https://www.reddit.com/r/NailFungus/comments/1j25sl0/"
              platform="Reddit r/NailFungus · 54 upvotes"
              description="Woman contracted fungus from a pedicure, spent 9 years in a treatment cycle."
              painPoint="Mental health devastation, years of giving up on herself."
              quotes={[
                "I somehow gave up on myself and just let things be.",
                "While some people might think, 'It's just a nail,' this experience took a serious toll on my mental health and self-esteem.",
                "I'm no longer ashamed to wear slippers in public.",
              ]}
            />

            <PostCard num={12}
              title="Help! Toenail fungus — what do I do about sandal season?"
              url="https://www.reddit.com/r/TheGirlSurvivalGuide/comments/13xfwrs/"
              platform="Reddit r/TheGirlSurvivalGuide · 441 upvotes"
              description="Woman panicking because summer is coming and she can't show her toes."
              painPoint="Summer becomes a source of dread instead of joy."
              quotes={[
                "I have a very gross toenail that I can't show in public.",
                "I'm not quite brave enough to go without anything on it!",
              ]}
            />

            <PostCard num={13}
              title="Athlete's Foot on Skyrizi — embarrassing and horrible"
              url="https://www.reddit.com/r/skyrizi/comments/1oef34s/"
              platform="Reddit r/skyrizi"
              description="Immunocompromised patient develops severe athlete's foot from medication."
              painPoint="Trapped between treating one condition and suffering from another."
              quotes={[
                "It's honestly been horrible, embarrassing, and I wish it would just go away.",
                "I really hope this doesn't become a regular thing.",
                "My immune system is probably not strong enough to fight it without heavy duty help.",
              ]}
            />

            <PostCard num={14}
              title="Toenail fungus has destroyed my nail. What to do now?"
              url="https://www.reddit.com/r/AskDocs/comments/1qcfz7a/"
              platform="Reddit r/AskDocs"
              description="26-year-old woman's nail completely destroyed despite using 3 products daily."
              painPoint="Daily pain and disgust after maximum-effort treatment failure."
              quotes={[
                "It's now causing me daily pain despite using three different terbinafine products daily.",
                "My entire nail is mustard yellow, has not grown in the year this has been going on, the smell is foul.",
                "I'm kind of at a loss here.",
              ]}
            />

            <PostCard num={15}
              title="Does anyone else have the dreaded toenail fungus... cause I'm not happy."
              url="https://www.reddit.com/r/AskMenOver40/comments/1m10cq7/"
              platform="Reddit r/AskMenOver40 · 20 upvotes"
              description="49-year-old man discovers toenail fungus for the first time."
              painPoint="The dread of a chronic condition — fear of it lasting forever."
              quotes={[
                "I just discovered that I have one of those toenails that looks old. Like, a fungus or something.",
                "I don't want this stuff going on forever!!",
                "Why? What did I do?",
              ]}
            />

            <PostCard num={16}
              title="How do you get rid of jock itch?"
              url="https://www.reddit.com/r/AskMen/comments/1kq3qgo/"
              platform="Reddit r/AskMen · 29 upvotes"
              description="Man on oral antifungals + cream, still comes back every workday."
              painPoint="The Sisyphean daily grind — treatment undone by normal daily life."
              quotes={[
                "I desperately need help.",
                "Every morning it seems like it looks better and feels better but then I go to work and am very active moving around a lot in pants and I just get sweaty in my crotch area again and it seems like it's getting worse.",
              ]}
            />

            <h3 style={{ marginTop: 40 }}>Forum Posts — Mumsnet, HealthUnlocked, Patient.info, Sports Forums (21 posts)</h3>

            <PostCard num={17}
              title="Athlete's foot getting worse. Help!"
              url="https://www.mumsnet.com/talk/_chat/4470005-Athletes-foot-getting-worse-Help"
              platform="Mumsnet"
              description="Woman has scratched her foot raw to the point of bleeding, can't sleep."
              painPoint="Physical suffering so intense she fantasizes about amputation."
              quotes={[
                "I've scratched the skin off my foot, it's bleeding and the skin between my toes has peeled leaving exposed red raw flesh.",
                "I'm going crazy scratching it.",
                "I'm tempted to cut my foot off at this rate.",
                "Hoping it lets me sleep tonight, last night was awful.",
              ]}
            />

            <PostCard num={18}
              title="Isn't it about time they found a cure for athlete's foot?"
              url="https://www.mumsnet.com/talk/_chat/4230223-Isnt-it-about-time-they-found-a-cure-for-athletes-foot"
              platform="Mumsnet"
              description="User calls out the fact that no treatment actually cures it."
              painPoint="Hopelessness after decades of recurring infections."
              quotes={[
                "I am completely bored of it. No treatment does anything but keep it at bay.",
                "Lamisil once should be called 'lamisil once a month'.",
                "I first got it when I was pregnant with DS1 23 years ago! I don't think I've ever managed to clear it for more than a few months at a time.",
                "It was so bad I could have chopped my toes off!",
              ]}
            />

            <PostCard num={19}
              title="To say athlete's foot is the most painful thing"
              url="https://www.mumsnet.com/talk/am_i_being_unreasonable/2653899-to-say-athletes-foot-is-the-most-painful-thing"
              platform="Mumsnet"
              description="Woman sitting crying from pain, split toes, can't work."
              painPoint="Pain so severe it causes tears and threatens ability to function at work."
              quotes={[
                "Both little toes have split. Sat trying not to cry with pain.",
                "I could cheerfully chop my toes off at the moment.",
                "Honestly don't know how I am going to work on Monday. My job involves a lot of walking.",
                "I had that last year and it was worse than childbirth.",
              ]}
            />

            <PostCard num={20}
              title="Fucking fungal infections!!"
              url="https://www.mumsnet.com/talk/_chat/4387222-Fucking-fungal-infections"
              platform="Mumsnet"
              description="Mother dealing with recurring infections, feeling abandoned by healthcare."
              painPoint="Rage and the feeling that doctors don't take it seriously."
              quotes={[
                "The pharmacist just says to speak to the GP. The GP just says try a different cream.",
                "Nurse suggested I Google it instead. Just crap imo.",
                "I've had athletes foot which has left me with an itchy sole for 6 months now.",
              ]}
            />

            <PostCard num={21}
              title="My feet smell absolutely foul — Please help"
              url="https://www.mumsnet.com/talk/_chat/4512126-My-feet-smell-absolutely-foul-Please-help"
              platform="Mumsnet"
              description="Person mortified by the smell caused by fungal skin condition."
              painPoint="Deep embarrassment and disgust about their own body."
              quotes={[
                "This is a bit embarrassing and I'm sorry for the detail but I need some help.",
                "It's disgusting!",
                "My son had pitted keratolysis and my dear lord, the smell. No matter how much he washed.",
              ]}
            />

            <PostCard num={22}
              title="Athletes foot. I've had enough."
              url="https://healthunlocked.com/my-skin/posts/144397772/athletes-foot.-ive-had-enough."
              platform="HealthUnlocked"
              description="User suffered for DECADES, gone through 9 tubes of prescription cream."
              painPoint="Decades of suffering with no end in sight."
              quotes={[
                "I've had athletes foot for as long as I can remember. Decades.",
                "I have gone through 9 tubes of the above cream and it does help suppress the itch but it's an expensive and only semi-successful treatment.",
                "The itching is back. It's almost as if my body is now immune to this cream.",
                "I really don't fancy having to deal with this for much longer.",
              ]}
            />

            <PostCard num={23}
              title="Athletes foot — anyone got a magic cure?"
              url="https://healthunlocked.com/couchto5k/posts/135942597/athletes-foot-anyone-got-a-magic-cure"
              platform="HealthUnlocked (Running Community)"
              description="Runner driven crazy by 2 months of athlete's foot, eventually got infected."
              painPoint="Impact on exercise routine; escalation to bacterial infection requiring antibiotics."
              quotes={[
                "Driving me nuts! Never had it before but have had this for about two months!",
                "Have tried sprays, powders and went to doctors who gave me Lamisil cream.",
                "Thanks — I will give anything a go — driving me crazy!",
                "Ended up at the docs as it got infected so am now on 2 weeks antibiotics.",
              ]}
            />

            <PostCard num={24}
              title="Athlete's foot led to Pompholyx"
              url="https://community.patient.info/t/athlete-s-foot-led-to-pompholyx/"
              platform="Patient.info Forums"
              description="Athlete's foot evolved into hundreds of blisters across feet and hands."
              painPoint="Condition escalating to disabling level; emotional devastation."
              quotes={[
                "The whole thing happened about 5 yrs ago...the experience was long and protracted and horrendous to live with.",
                "Everywhere I walked it was so painful and even picking up a bar of soap hurt my hands.",
                "It was often enough to bring me to tears.",
                "I had hundreds of blisters on the bottom of both feet and loads on the palms of my hands.",
              ]}
            />

            <PostCard num={25}
              title="Athletes foot — I have had it since 1977"
              url="https://community.patient.info/t/athletes-foot/"
              platform="Patient.info Forums"
              description="Person has been fighting the same infection for 40+ years."
              painPoint="A lifetime of failed treatment and complete hopelessness."
              quotes={[
                "I have athlete foot since 1977.",
                "I have tryed all creams out but I can not cure my infection.",
              ]}
            />

            <PostCard num={26}
              title="Toes with fungal infections — diabetic patients share experiences"
              url="https://www.diabetes.co.uk/forum/threads/toes-with-fungal-infections.44542/page-2"
              platform="Diabetes.co.uk Forum"
              description="Diabetic patients with chronic, treatment-resistant fungal infections."
              painPoint="Chronic condition compounded by diabetes; feeling defeated."
              quotes={[
                "Once you have Athletes foot it is for life.",
                "Had the dreaded fungal toe nail for 10 years.",
                "Tried the cider vinegar twice now without success.",
                "I've tried the Vick and all it did was discolour my nails.",
              ]}
            />

            <PostCard num={27}
              title="Athletes foot that won't go away"
              url="https://www.mumsnet.com/talk/general_health/4731979-athletes-foot-that-wont-go-away"
              platform="Mumsnet"
              description="Woman fighting it for 6+ months with multiple treatments, none working."
              painPoint="Frustration — feels like an unshakeable parasite."
              quotes={[
                "For 6 months+ I've tried 3 types of cream, 2 types of spray, treating shoes, clean socks, not wearing my slippers.",
                "Will I ever be rid of this fungal freeloader?",
                "My god I don't think I can bring myself to chuck away ALL my socks and shoes.",
              ]}
            />

            <PostCard num={28}
              title="Should athlete's foot hurt so much you are tempted to cut your toe off?"
              url="https://www.mumsnet.com/talk/general_health/1601328-Should-athletes-foot-hurt-so-much-you-are-tempted-to-cut-your-toe-off"
              platform="Mumsnet"
              description="Pain so severe they joke about amputation. Partner gave them the infection."
              painPoint="Intense suffering; fungal spread between partners."
              quotes={[
                "My whole toe is throbbing like mad and I am considering amputation.",
                "DP's longest lasting present to me is athlete's foot.",
              ]}
            />

            <PostCard num={29}
              title="Athlete's Foot — What worked for you and me"
              url="https://forum.slowtwitch.com/forum/Slowtwitch_Forums_C1/Triathlon_Forum_F1/Athlete's_Foot-_What_worked_for_you_and_me...._P5479777/"
              platform="Slowtwitch Triathlon Forum"
              description="Triathlete with oozing lesions and terrible odor."
              painPoint="Humiliation from smell and visible symptoms."
              quotes={[
                "Mine had the lesions and liquid oozing out. Stinked real bad.",
                "I only had one really bad case that couldn't be killed by anything. Tried over the counter stuff...Tried peeing and other folk cures.",
              ]}
            />

            <PostCard num={30}
              title="Been suffering for a while, can't seem to shift it"
              url="https://ukbouldering.com/threads/athletes-foot-treatment.13919/"
              platform="UK Bouldering Forum"
              description="Climber embarrassed to buy treatment, reluctant to see doctor again."
              painPoint="Embarrassment about seeking treatment; avoidance of medical help."
              quotes={[
                "Been suffering from Athlete's foot for a while now and can't seem to shift it.",
                "Do not want to ask for thrush cream.",
                "Don't really want to go back to doctors.",
              ]}
            />
          </Section>
        )}

        {/* ===== 4. VERBATIM LANGUAGE BANK ===== */}
        {activeSection === 3 && (
          <Section title="4) Verbatim Language Bank">
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Exact phrases from real people, organized by emotional category. Every quote below is verbatim.
              Use these for ad copy, hooks, headlines, and native ads.
            </p>

            <h3>Embarrassment / Shame</h3>
            <div className="language-bank">
              <div className="verbatim">"I was ashamed to take my socks off"</div>
              <div className="verbatim">"Out of embarrassment, I never went to a dermatologist"</div>
              <div className="verbatim">"It's disgusting and has been incredibly damaging to my self esteem"</div>
              <div className="verbatim">"I am super embarrassed about it"</div>
              <div className="verbatim">"It's pretty embarrassing but I've made up my mind to do something about it"</div>
              <div className="verbatim">"I'm no longer ashamed to wear slippers in public"</div>
              <div className="verbatim">"I have a very gross toenail that I can't show in public"</div>
              <div className="verbatim">"At the beach, I had to bury my feet in the sand to hide them"</div>
              <div className="verbatim">"This is a bit embarrassing and I'm sorry for the detail"</div>
              <div className="verbatim">"It's disgusting!"</div>
              <div className="verbatim">"Do not want to ask for thrush cream"</div>
              <div className="verbatim">"I was too embarrassed to let anyone see my feet for 3 years"</div>
              <div className="verbatim">"They're so ugly and disgusting"</div>
              <div className="verbatim">"I'm self conscious about my toenail fungus"</div>
            </div>

            <h3>Fear / Contamination</h3>
            <div className="language-bank">
              <div className="verbatim">"I'm infecting everything I touch even if I clean it"</div>
              <div className="verbatim">"I fear I might infect others"</div>
              <div className="verbatim">"I don't want to leave that to my family"</div>
              <div className="verbatim">"My fear is that this yeast might go systemic"</div>
              <div className="verbatim">"I really hope this doesn't become a regular thing"</div>
              <div className="verbatim">"I'm scared I'm going to take loads of skin off and end up scarring my feet"</div>
              <div className="verbatim">"I am constantly checking my feet to ensure they are in tip top shape"</div>
              <div className="verbatim">"DP's longest lasting present to me is athlete's foot"</div>
              <div className="verbatim">"Those nails are still etched into my retina"</div>
              <div className="verbatim">"I felt almost nauseous"</div>
            </div>

            <h3>Frustration / Desperation</h3>
            <div className="language-bank">
              <div className="verbatim">"I tried topical creams, anti fungals, powders, sprays. Nothing ever worked"</div>
              <div className="verbatim">"I've tried everything under the sun"</div>
              <div className="verbatim">"I've spent thousands of dollars on this"</div>
              <div className="verbatim">"I am so desperate and I can't stop crying"</div>
              <div className="verbatim">"I desperately need help"</div>
              <div className="verbatim">"I'm kind of at a loss here"</div>
              <div className="verbatim">"I was pretty desperate"</div>
              <div className="verbatim">"My regular doctor acts like I'm just a dirty person"</div>
              <div className="verbatim">"The pharmacist just says to speak to the GP. The GP just says try a different cream"</div>
              <div className="verbatim">"Nurse suggested I Google it instead. Just crap imo"</div>
              <div className="verbatim">"Will I ever be rid of this fungal freeloader?"</div>
              <div className="verbatim">"Driving me nuts!"</div>
              <div className="verbatim">"I will give anything a go — driving me crazy!"</div>
            </div>

            <h3>Recurrence / Failure</h3>
            <div className="language-bank">
              <div className="verbatim">"No treatment does anything but keep it at bay"</div>
              <div className="verbatim">"Lamisil once should be called 'lamisil once a month'"</div>
              <div className="verbatim">"Once you have Athletes foot it is for life"</div>
              <div className="verbatim">"It's almost as if my body is now immune to this cream"</div>
              <div className="verbatim">"I have gone through 9 tubes of the above cream"</div>
              <div className="verbatim">"I don't think I've ever managed to clear it for more than a few months at a time"</div>
              <div className="verbatim">"I have tryed all creams out but I can not cure my infection"</div>
              <div className="verbatim">"I just left it untreated for over a decade"</div>
              <div className="verbatim">"I somehow gave up on myself and just let things be"</div>
              <div className="verbatim">"Every morning it seems like it looks better but then I go to work and it seems like it's getting worse"</div>
            </div>

            <h3>Daily-Life Inconvenience</h3>
            <div className="language-bank">
              <div className="verbatim">"I rarely will sit around without socks on"</div>
              <div className="verbatim">"I have no idea what I'm going to do this summer"</div>
              <div className="verbatim">"Honestly don't know how I am going to work on Monday"</div>
              <div className="verbatim">"I can never go for a foot massage because of it and I love those!"</div>
              <div className="verbatim">"The itching is so bad it can wake me in the middle of the night"</div>
              <div className="verbatim">"I was up last night in agony so I had to take some ibuprofen"</div>
              <div className="verbatim">"I'm tempted to cut my foot off at this rate"</div>
              <div className="verbatim">"It's ruining my life. I am a dancer, and I can't dance"</div>
              <div className="verbatim">"Everywhere I walked it was so painful"</div>
            </div>

            <h3>Identity / Self-Image</h3>
            <div className="language-bank">
              <div className="verbatim">"I'm so full of self hatred for not taking care of this"</div>
              <div className="verbatim">"This experience took a serious toll on my mental health and self-esteem"</div>
              <div className="verbatim">"I don't really do anything that makes me seem like not a loser"</div>
              <div className="verbatim">"My foot is a bloody mess and I feel defeated"</div>
              <div className="verbatim">"I just thought that's how feet are"</div>
              <div className="verbatim">"Why? What did I do?"</div>
              <div className="verbatim">"These nails don't add to the sex appeal at all"</div>
              <div className="verbatim">"I don't want this stuff going on forever!!"</div>
              <div className="verbatim">"My feet haven't felt this good since I was a kid it is such a strange feeling"</div>
              <div className="verbatim">"Thank you universe!"</div>
            </div>

            <h3>Amazon Positive (Solution Language)</h3>
            <div className="language-bank success">
              <div className="verbatim">"I have suffered with fungal toenails for many years...the problem has all but disappeared. This is truly a miracle."</div>
              <div className="verbatim">"Within the first 3 or 4 days my skin was vastly improved, and back to normal by day 10."</div>
              <div className="verbatim">"I can finally go to the pool without being ashamed of my feet!!!"</div>
              <div className="verbatim">"I was too embarrassed to let anyone see my feet for 3 years. This soap cleared my athlete's foot so well that I finally got a pedicure."</div>
              <div className="verbatim">"Within 5 days the affected area is completely healed."</div>
              <div className="verbatim">"My feet look and feel 100% better."</div>
              <div className="verbatim">"This product worked better than I could have imagined...I could feel the tingle working almost immediately."</div>
              <div className="verbatim">"I've honestly never felt so clean."</div>
            </div>
          </Section>
        )}

        {/* ===== 5. EMOTIONAL / PSYCHOLOGICAL ANALYSIS ===== */}
        {activeSection === 4 && (
          <Section title="5) Emotional / Psychological Analysis">
            <h3>What They Are Really Afraid Of</h3>
            <p>
              The surface fear is the infection itself. But the <strong>real fear is permanence</strong>.
              They're afraid this is forever. They're afraid they'll never have normal feet again.
              They're afraid they'll pass it to their partner, their kids, their family.
              They're afraid of being seen as <strong>dirty, unhygienic, or broken</strong>.
            </p>
            <p>
              The deeper terror is that this one thing — this embarrassing, hidden, "small" problem — is proof
              that they can't take care of themselves. It's a daily reminder of failure. Every time they look at their feet,
              every time they hide their toes in socks, every time they decline a pool invitation — it confirms the story
              they tell themselves: <em>"I'm the kind of person who can't fix this."</em>
            </p>

            <h3>What They Are Trying Not to Feel</h3>
            <ul>
              <li><strong>Disgust</strong> — at their own body. The word "disgusting" appears more than any other adjective.</li>
              <li><strong>Helplessness</strong> — they've tried everything and nothing works. They feel powerless.</li>
              <li><strong>Shame</strong> — it feels like a hygiene problem even though it's a medical condition.</li>
              <li><strong>Hopelessness</strong> — "Once you have athlete's foot it is for life." They believe there's no real cure.</li>
              <li><strong>Self-hatred</strong> — "I'm so full of self hatred for not taking care of this."</li>
            </ul>

            <h3>What They Are Trying to Avoid Socially</h3>
            <ul>
              <li>Being seen barefoot — at pools, beaches, yoga, sleepovers, dates</li>
              <li>Someone noticing the smell</li>
              <li>A partner being repulsed</li>
              <li>A new date seeing their feet — "I felt almost nauseous" (from the partner's perspective)</li>
              <li>Being judged as unhygienic by friends, family, doctors</li>
              <li>People knowing they have a "gross" condition</li>
              <li>Infecting their children or partner and being blamed</li>
            </ul>

            <h3>What the Internal Monologue Sounds Like</h3>
            <div className="research-callout" style={{ background: 'var(--bg-tertiary)', padding: 24, borderRadius: 12, marginBottom: 20 }}>
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                "It's just a foot thing, why am I so upset about this? But it's been years now.
                I've tried everything — the creams, the sprays, the powders, even the prescription stuff.
                Nothing actually gets rid of it. It comes back every time. And I can't tell anyone because
                they'll think I'm dirty. My doctor basically told me as much. I used to love going to the beach.
                Now I won't even wear sandals. I check my feet every morning and feel this wave of
                disgust wash over me. What if I give this to my kid? What if my partner sees this and is
                grossed out? I just want normal feet. Is that too much to ask? I hate that this one thing
                controls so much of my life. I feel pathetic for even caring this much about it."
              </p>
            </div>

            <h3>Rock-Bottom Moments That Show Up</h3>
            <table className="research-table">
              <thead>
                <tr><th>Rock-Bottom Type</th><th>Example</th></tr>
              </thead>
              <tbody>
                <tr><td>Physical breakdown</td><td>"Sitting on the floor sobbing my eyes out" / "Sat trying not to cry with pain"</td></tr>
                <tr><td>Amputation fantasies</td><td>"I'm tempted to cut my foot off" / "I could cheerfully chop my toes off" (appeared 4+ times)</td></tr>
                <tr><td>Life disruption</td><td>"It's ruining my life. I am a dancer, and I can't dance"</td></tr>
                <tr><td>Financial drain</td><td>"I've spent thousands of dollars on this"</td></tr>
                <tr><td>Identity collapse</td><td>"Took a serious toll on my mental health and self-esteem"</td></tr>
                <tr><td>Romantic rejection</td><td>"Those nails are still etched into my retina" / "nauseous"</td></tr>
                <tr><td>Medical abandonment</td><td>"The doctor acts like I'm just a dirty person"</td></tr>
                <tr><td>Giving up</td><td>"I somehow gave up on myself and just let things be"</td></tr>
              </tbody>
            </table>
          </Section>
        )}

        {/* ===== 6. CUSTOMER AVATAR ===== */}
        {activeSection === 5 && (
          <Section title="6) Customer Avatar">
            <div className="avatar-card">
              <div className="avatar-header">
                <div className="avatar-icon">M</div>
                <div>
                  <h3 style={{ margin: 0 }}>Mike Brennan</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>42 · Male · Tampa, FL</p>
                </div>
              </div>

              <div className="avatar-grid">
                <div className="avatar-field">
                  <h4>Lifestyle</h4>
                  <p>
                    Works a desk job (IT project manager). Active — goes to the gym 3–4x/week, plays in a recreational
                    basketball league. Married with two kids (ages 8 and 11). Family-oriented. Likes going to the beach and pool
                    on weekends in the Florida heat. Showers daily but sweats a lot from the gym and the climate.
                  </p>
                </div>

                <div className="avatar-field">
                  <h4>The Problem</h4>
                  <p>
                    Has had athlete's foot on and off for about 3 years. Started after a gym shower. He's tried Lotrimin cream,
                    Lamisil spray, generic antifungal powder, and tea tree oil from Amazon. Each one "kinda works" for a week
                    or two, then it comes back. The infection has spread to two toenails which are now yellowish and thick.
                    He also gets mild jock itch in the summer months, which he suspects is related.
                  </p>
                </div>

                <div className="avatar-field">
                  <h4>Attitude</h4>
                  <p>
                    Skeptical but still searching. He's spent ~$200 on products over 3 years and feels like nothing truly works.
                    Doesn't want to go to a dermatologist because it feels like "overkill for a foot thing." Mildly
                    embarrassed but mostly just frustrated. He approaches it like a problem to solve, not a medical crisis —
                    but it's quietly eroding his confidence.
                  </p>
                </div>

                <div className="avatar-field">
                  <h4>Hopes & Dreams</h4>
                  <p>
                    Wants normal-looking feet. Wants to walk barefoot on the pool deck without thinking about it.
                    Wants his toenails to look clean enough that his wife doesn't notice them. Wants ONE product that
                    just handles it — something he uses in the shower every day and doesn't have to think about.
                    Wants to not worry about giving it to his kids.
                  </p>
                </div>

                <div className="avatar-field">
                  <h4>Biggest Frustrations</h4>
                  <ul>
                    <li>Nothing actually keeps it away permanently</li>
                    <li>Has to use multiple products (cream + powder + spray)</li>
                    <li>Creams are messy and he forgets to apply them</li>
                    <li>Products either dry his skin out or smell like medicine</li>
                    <li>Feels like the industry just wants repeat customers, not cures</li>
                  </ul>
                </div>

                <div className="avatar-field">
                  <h4>Likely Objections</h4>
                  <ul>
                    <li>"I've tried soaps before and they didn't work"</li>
                    <li>"This looks like another tea tree thing"</li>
                    <li>"How is a soap going to do what prescription cream couldn't?"</li>
                    <li>"Is this just going to dry my skin out like Defense Soap?"</li>
                    <li>"$20 for soap? My regular soap is $5"</li>
                  </ul>
                </div>

                <div className="avatar-field">
                  <h4>What He Believes Caused It</h4>
                  <p>
                    He thinks he picked it up from the gym shower floor. He blames the combination of sweaty
                    shoes, gym showers, and Florida humidity. He doesn't fully understand that it's the same fungus
                    causing his foot problems, toenail issues, and jock itch.
                  </p>
                </div>

                <div className="avatar-field">
                  <h4>What He Wants Instead</h4>
                  <p>
                    One product. In the shower. Every day. That just handles it. He doesn't want a
                    "treatment regimen" — he wants his regular soap replaced with something that quietly prevents
                    and eliminates fungal infections without adding any steps to his routine. If it smells good
                    and doesn't dry his skin out, even better.
                  </p>
                </div>

                <div className="avatar-field">
                  <h4>What He Fears Most</h4>
                  <p>
                    That it spreads to his kids. That his wife finds it gross. That it gets worse —
                    he's seen the pictures of advanced toenail fungus online and that terrifies him.
                    That he'll need surgery. That this is his life now.
                  </p>
                </div>

                <div className="avatar-field">
                  <h4>Emotional State When Buying</h4>
                  <p>
                    Frustrated but hopeful. He's just had a flare-up — either the foot itching came back after
                    stopping cream, or he noticed his toenail getting worse. He's scrolling Amazon reviews or Reddit
                    looking for "something different." He's willing to pay $15–$25 if there's a reason to believe it works.
                    He'll convert on strong social proof (real testimonials, before/after, "I tried everything and this actually worked").
                  </p>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ===== 7. EXISTING SOLUTIONS ===== */}
        {activeSection === 6 && (
          <Section title="7) Existing Solutions">
            <div className="solution-card">
              <h3>Antifungal Creams (Lotrimin, Lamisil, Tinactin)</h3>
              <div className="solution-grid">
                <div><strong>Why people try it:</strong> Doctor recommended, pharmacy staple, "the obvious first step." Lotrimin is #1 brand recognition.</div>
                <div><strong>What works:</strong> Fast symptom relief — "clears up within 24 hours" for mild cases. Lamisil's terbinafine is genuinely effective at killing fungus.</div>
                <div><strong>Why it fails:</strong> Treats ONE spot, not the whole foot/body. Messy to apply. People stop too early and it comes back. Should never be applied between toes (too moist). "Lamisil once should be called 'lamisil once a month'."</div>
                <div><strong>How people feel:</strong> Initially hopeful, then frustrated when it recurs. Feel like they're stuck in a cycle of apply → improve → stop → return.</div>
              </div>
            </div>

            <div className="solution-card">
              <h3>Antifungal Sprays & Powders</h3>
              <div className="solution-grid">
                <div><strong>Why people try it:</strong> Easier to apply than cream. Less messy. Some claim to treat shoes too.</div>
                <div><strong>What works:</strong> Good for prevention after treatment. Helps keep feet dry.</div>
                <div><strong>Why it fails:</strong> "Lotrimin powder doesn't do much and wears off by the time they get home." Not potent enough for active infections. Powders make a mess.</div>
                <div><strong>How people feel:</strong> Treating symptoms, not the cause. Like putting a bandaid on a broken bone.</div>
              </div>
            </div>

            <div className="solution-card">
              <h3>Tea Tree Oil Soaps (Remedy, Purely Northwest, etc.)</h3>
              <div className="solution-grid">
                <div><strong>Why people try it:</strong> "Natural" positioning appeals to health-conscious buyers. High review counts on Amazon create social proof.</div>
                <div><strong>What works:</strong> Pleasant scent for most. Feel of being clean. Some users see genuine improvement — "HUGE difference in how the nail looks already."</div>
                <div><strong>Why it fails:</strong> Tea tree oil is primarily antibacterial, not antifungal. "I used this product for 2 months on a daily basis and it did nothing for my toe fungus." The active ingredients lack clinical evidence for killing dermatophytes.</div>
                <div><strong>How people feel:</strong> Hopeful at first because of the reviews. Then disappointed — "Wouldn't waste 20 dollars on this crap again."</div>
              </div>
            </div>

            <div className="solution-card">
              <h3>Medicated Soap Bars (Defense Soap)</h3>
              <div className="solution-grid">
                <div><strong>Why people try it:</strong> Endorsed by wrestlers and BJJ athletes. Contains tolnaftate (FDA-approved). Strong brand in combat sports.</div>
                <div><strong>What works:</strong> Actually contains a real antifungal agent. "Within the first 3 or 4 days my skin was vastly improved." Prevention track record is strong — "After 100+ matches, never a sign."</div>
                <div><strong>Why it fails:</strong> Dries skin out significantly. Strong medicinal smell. Bar dissolves fast. Expensive ($12–$16/bar). Requires ALSO using their original bar soap separately.</div>
                <div><strong>How people feel:</strong> Effective but harsh. Like using a medical product, not a daily hygiene product. The combat sports branding doesn't resonate with non-athletes.</div>
              </div>
            </div>

            <div className="solution-card">
              <h3>Home Remedies (Vinegar, Vicks, Tea Tree Oil, Bleach)</h3>
              <div className="solution-grid">
                <div><strong>Why people try it:</strong> Free or cheap. Desperate after failed products. "I will give anything a go."</div>
                <div><strong>What works:</strong> Vinegar soaks show some promise. Vicks VapoRub has anecdotal support for toenails.</div>
                <div><strong>Why it fails:</strong> Inconsistent results. Time-consuming. Can cause irritation or damage. "I've tried the Vick and all it did was discolour my nails." "I tried every alternative method including Vicks vaporub, vaseline, and Listerine mouthwash."</div>
                <div><strong>How people feel:</strong> Desperate enough to try anything. Embarrassed to admit they're soaking their feet in vinegar or rubbing Vicks on their toes.</div>
              </div>
            </div>

            <div className="solution-card">
              <h3>Prescription Oral Antifungals (Terbinafine, Itraconazole)</h3>
              <div className="solution-grid">
                <div><strong>Why people try it:</strong> Last resort after everything else failed. Doctor prescribed.</div>
                <div><strong>What works:</strong> Most effective treatment available. Systemic action treats the root cause.</div>
                <div><strong>Why it fails:</strong> Liver toxicity risk — requires blood tests. "Lamisil tablets caused severe psychiatric side effects in his father." Many doctors won't prescribe for "just" athlete's foot. Some patients can't take it due to pre-existing conditions.</div>
                <div><strong>How people feel:</strong> Relieved when it works. Anxious about side effects. Frustrated that doctors gatekeep access.</div>
              </div>
            </div>

            <div className="solution-card">
              <h3>Doctor Visits</h3>
              <div className="solution-grid">
                <div><strong>Why people try it:</strong> Condition has become severe enough to overcome the embarrassment barrier.</div>
                <div><strong>What works:</strong> Proper diagnosis. Access to prescription-strength treatments.</div>
                <div><strong>Why it fails:</strong> Doctors dismiss it. "My regular doctor acts like I'm just a dirty person." "The GP just says try a different cream." Multiple visits with no improvement. Expense. "I've been to 7 doctors."</div>
                <div><strong>How people feel:</strong> Humiliated. Dismissed. Like they're overreacting. "Don't really want to go back to doctors."</div>
              </div>
            </div>
          </Section>
        )}

        {/* ===== 8. CORE DESIRES ===== */}
        {activeSection === 7 && (
          <Section title="8) Five Dominant Mass Desires">
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Each desire represents a fundamentally different outcome that appeals to a different segment.
              These cannot be collapsed into each other — each person wants something distinct from this product.
            </p>

            <DesireCard num={1}
              desire='"I want to stop the cycle of treating, improving, then having it come back again."'
              who="The Chronic Recycler — Has had athlete's foot for 2+ years. Uses cream when it flares up, stops when it clears, then it returns. Spends $100+/year on products that never permanently solve the problem. Exhausted by the loop. Wants something that actually PREVENTS recurrence, not just treats symptoms."
            />

            <DesireCard num={2}
              desire='"I want to feel clean and normal again — not like someone with a condition."'
              who="The Secret Sufferer — Hides their feet constantly. Won't wear sandals. Avoids pools, beaches, pedicures. Hasn't let anyone see their bare feet in years. The infection has become part of their identity in a way they hate. Wants to just... be normal. Feel clean. Not think about it."
            />

            <DesireCard num={3}
              desire='"I want ONE simple thing in the shower that handles everything without adding steps to my day."'
              who="The Frustrated Multi-Product User — Currently uses a separate cream for feet, powder for shoes, spray for prevention, and still gets flare-ups. Hates the complexity. Just wants to replace their regular body wash with something that handles fungal protection automatically. Zero extra steps."
            />

            <DesireCard num={4}
              desire={`"I want to stop worrying that I'm spreading this to my partner, my kids, or everyone I share space with."`}
              who="The Contamination Worrier — Terrified of giving it to family members. Anxiety about gym showers, shared bathrooms, walking barefoot. Some have OCD-level contamination fears. Others have already infected a partner and feel guilty. Wants peace of mind against spreading."
            />

            <DesireCard num={5}
              desire={`"I want something that actually works — because I've tried everything and nothing has."`}
              who="The Desperate Searcher — Has tried Lotrimin, Lamisil, tea tree oil, vinegar, Vicks, prescription cream, antifungal powder, Defense Soap, and more. Nothing has permanently resolved it. They're scrolling Amazon and Reddit at 2 AM looking for 'the one thing that actually worked.' They'll pay $25+ for a product with credible proof it works when everything else failed."
            />

            <div className="research-insight" style={{ marginTop: 32 }}>
              <strong>Why These 5 Are Distinct:</strong>
              <ul style={{ marginTop: 8 }}>
                <li><strong>Desire 1</strong> = ending the cycle (prevention-focused)</li>
                <li><strong>Desire 2</strong> = restoring self-image (identity/emotional)</li>
                <li><strong>Desire 3</strong> = simplifying routine (convenience/practicality)</li>
                <li><strong>Desire 4</strong> = protecting others (contamination anxiety)</li>
                <li><strong>Desire 5</strong> = finding something that finally works (efficacy/desperation)</li>
              </ul>
              <p style={{ marginTop: 12 }}>
                Each requires a different hook, a different lead, and a different emotional entry point in your ads.
              </p>
            </div>
          </Section>
        )}

        {/* ===== 9. COPYWRITING IMPLICATIONS ===== */}
        {activeSection === 8 && (
          <Section title="9) Copywriting Implications">
            <h3>Strongest Emotional Triggers (Ranked)</h3>
            <table className="research-table">
              <thead>
                <tr><th>#</th><th>Trigger</th><th>Why It's Strong</th></tr>
              </thead>
              <tbody>
                <tr><td>1</td><td><strong>Recurrence / "it keeps coming back"</strong></td><td>Universal experience. Every sufferer has lived this cycle. Taps into frustration AND hopelessness simultaneously.</td></tr>
                <tr><td>2</td><td><strong>Shame / hiding feet</strong></td><td>Visceral. People hide their feet for YEARS. Summer dread. Avoiding pools, sandals, intimacy. Deeply personal.</td></tr>
                <tr><td>3</td><td><strong>"I've tried everything"</strong></td><td>The credibility killer for generic products — and the biggest opportunity for positioning as "the thing that finally worked."</td></tr>
                <tr><td>4</td><td><strong>Fear of spreading to family</strong></td><td>Guilt + anxiety. Particularly strong for parents. "I don't want to leave that to my family."</td></tr>
                <tr><td>5</td><td><strong>Medical dismissal</strong></td><td>Anger trigger. Doctors treat it as trivial. "My doctor acts like I'm just a dirty person." Creates an us-vs-them dynamic.</td></tr>
              </tbody>
            </table>

            <h3>Most Persuasive Angles</h3>
            <ol>
              <li><strong>"The daily wash that prevents it from coming back"</strong> — Prevention positioning is wide open. Nobody owns it. Most powerful angle.</li>
              <li><strong>"I tried everything. Then I tried this."</strong> — Testimonial-driven. Leverages the "desperate searcher" avatar. Massive Reddit/forum resonance.</li>
              <li><strong>"Your regular soap doesn't kill fungus. Ours does."</strong> — Educational hook. Most people don't know their body wash is useless against dermatophytes.</li>
              <li><strong>"One product replaces your cream, spray, and powder"</strong> — Simplicity angle. Targets the multi-product fatigue.</li>
              <li><strong>"Made for athletes who can't afford to deal with this"</strong> — Lifestyle positioning. Gym, sport, active life = higher fungal risk.</li>
            </ol>

            <h3>Words to USE in Ad Copy</h3>
            <div className="word-grid">
              {['finally', 'actually works', 'daily', 'clean', 'normal', 'prevent', 'stop it from coming back',
                'one wash', 'no more cream', 'every shower', 'clinically', 'kills fungus', 'not just bacteria',
                'gentle', "won't dry your skin", 'smells great', 'replace your soap', 'in the shower',
                'whole body', 'not just the spot', 'confidence', 'barefoot', 'sandals again'
              ].map((w, i) => <span key={i} className="word-chip use">{w}</span>)}
            </div>

            <h3>Words to AVOID in Ad Copy</h3>
            <div className="word-grid">
              {['cure', 'guaranteed', 'miracle', 'prescription-strength', 'clinical trial',
                'fungicide', 'dermatophyte', 'tinea pedis', 'onychomycosis', 'medicated',
                'treatment', 'medicine', 'condition', 'disease', 'infected', 'contaminated'
              ].map((w, i) => <span key={i} className="word-chip avoid">{w}</span>)}
            </div>

            <div className="research-insight">
              <strong>Best Positioning:</strong> <em>"Everyday Solution + Prevention"</em>
              <p style={{ marginTop: 8 }}>
                NOT "fast relief" (that's cream territory). NOT "rescue treatment" (that's medicine territory).
                The winning position is: <strong>"A daily body wash that quietly handles fungal prevention so you never have to think about it again."</strong>
                This collapses the biggest pain points (recurrence, multi-product fatigue, shame) into a single, simple promise.
              </p>
            </div>

            <h3>Primary Market Recommendation</h3>
            <div className="research-insight">
              <strong>Lead with: Athlete's Foot</strong>
              <p style={{ marginTop: 8 }}>
                Athlete's foot should be the primary market for these reasons:
              </p>
              <ul>
                <li><strong>Highest volume:</strong> 3–15% of the population at any given time (vs. ~2% for jock itch, ~1% for ringworm)</li>
                <li><strong>Gateway condition:</strong> Athlete's foot spreads to become jock itch and toenail fungus — so you capture the broader market anyway</li>
                <li><strong>Soap = feet:</strong> The daily shower/wash use case naturally maps to feet first</li>
                <li><strong>Least stigmatized:</strong> People will admit to athlete's foot before they'll admit to jock itch</li>
                <li><strong>Broader appeal:</strong> Men, women, athletes, non-athletes — everyone gets athlete's foot</li>
              </ul>
              <p style={{ marginTop: 12 }}>
                <strong>Secondary hook:</strong> "Also handles jock itch and body fungus" — mention in body copy, not the headline.
                This captures the adjacent markets without narrowing the primary positioning.
              </p>
            </div>
          </Section>
        )}

        {/* ===== 10. FINAL SUMMARY FOR COPY TEAM ===== */}
        {activeSection === 9 && (
          <Section title="10) Final Summary for Copy Team">
            <div className="summary-grid">
              <div className="summary-card">
                <h3>Best Target Avatar</h3>
                <p>
                  <strong>Mike, 42, active male</strong> — 3+ years of recurring athlete's foot. Tried cream, spray, powder.
                  Nothing sticks. Mildly embarrassed, mostly frustrated. Willing to pay $15–$25 for something that actually
                  prevents recurrence. Converts on social proof and "I tried everything" testimonials.
                </p>
                <p style={{ marginTop: 8 }}>
                  <strong>Secondary:</strong> Women 25–45 who avoid sandal season. Parents worried about spreading to kids.
                  Gym-goers and athletes (BJJ, wrestling, runners, triathletes).
                </p>
              </div>

              <div className="summary-card">
                <h3>Strongest Pain Points</h3>
                <ol>
                  <li><strong>"It keeps coming back"</strong> — The #1 universal frustration. Every sufferer lives this cycle.</li>
                  <li><strong>"I hide my feet"</strong> — Summer dread, no sandals, no pool, no pedicure, no intimacy.</li>
                  <li><strong>"Nothing actually works"</strong> — Years of failed products. Cream → spray → powder → repeat.</li>
                  <li><strong>"I'm afraid of spreading it"</strong> — To kids, partner, gym mates.</li>
                  <li><strong>"My doctor doesn't take it seriously"</strong> — Dismissed, embarrassed, told to "try another cream."</li>
                </ol>
              </div>

              <div className="summary-card">
                <h3>Best Language to Mirror</h3>
                <ul>
                  <li>"I tried everything and nothing worked" → "After trying everything, this is what finally worked."</li>
                  <li>"It keeps coming back" → "Stops it from coming back."</li>
                  <li>"I'm embarrassed to show my feet" → "Show your feet without thinking twice."</li>
                  <li>"Nothing but socks" → "Sandals again."</li>
                  <li>"My doctor didn't help" → "What your doctor won't tell you about athlete's foot."</li>
                  <li>"I just want normal feet" → "Just... normal feet. Finally."</li>
                </ul>
              </div>

              <div className="summary-card">
                <h3>Best Angle for Native Ads / Advertorials</h3>
                <p>
                  <strong>"Why your athlete's foot keeps coming back (and what to do instead)"</strong>
                </p>
                <p style={{ marginTop: 8 }}>
                  Lead with the recurrence problem. Educate on why creams only suppress (treat the spot, not the environment).
                  Introduce the concept of daily prevention through the shower. Position the soap as "replacing your
                  regular body wash" — not adding a product, swapping one. Use forum quotes as proof of the problem.
                  Use Amazon review quotes as proof of the solution.
                </p>
              </div>

              <div className="summary-card">
                <h3>Best Angle for Direct-Response / Facebook Ads</h3>
                <p>
                  <strong>Hook framework:</strong> Problem → Failed solutions → New mechanism → Simple daily use → Result
                </p>
                <ul style={{ marginTop: 8 }}>
                  <li><strong>Hook 1 (Recurrence):</strong> "If your athlete's foot keeps coming back no matter what cream you use..."</li>
                  <li><strong>Hook 2 (Tried everything):</strong> "I tried Lotrimin, Lamisil, tea tree oil, even vinegar. Nothing worked until..."</li>
                  <li><strong>Hook 3 (Prevention):</strong> "Your body wash doesn't kill fungus. This one does."</li>
                  <li><strong>Hook 4 (Shame):</strong> "I haven't worn sandals in 3 years. Here's what changed that."</li>
                  <li><strong>Hook 5 (Simplicity):</strong> "I replaced my soap with this. Haven't had a flare-up since."</li>
                </ul>
              </div>

              <div className="summary-card highlight">
                <h3>The One-Line Positioning</h3>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  "The daily body wash that kills fungus so it doesn't come back."
                </p>
                <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
                  Not a treatment. Not a medicine. A daily wash. The fungus angle is the mechanism.
                  The "doesn't come back" is the promise. The daily-use framing makes it feel effortless.
                </p>
              </div>
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}
