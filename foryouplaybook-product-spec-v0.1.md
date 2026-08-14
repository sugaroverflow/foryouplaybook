# ForYou Playbook — Product Specification v0.1

**Status:** Build-ready launch spec  
**Launch posture:** C-level demo polish with B-level foundations  
**Audience:** Individual X creators  
**Primary domain:** foryouplaybook.com  
**Working tagline:** **See how For You works. Then see how it works for you.**  
**North-star framing:** **Inside the For You explains X's algorithm. ForYou Playbook discovers yours.**

---

## 1. Product Summary

ForYou Playbook is a personalized X strategy agent grounded in two things:

1. what X's current open-source For You ranking code says the system values; and
2. what a creator's own posts actually generate when X distributes them.

It starts as an interactive algorithm playground, then turns the same concepts onto the user:

> You can test the algorithm. Now let's test your relationship with it.

A creator connects X. ForYou Playbook reads their posts from the current algorithm regime, analyzes observable performance and content patterns, gives them a playful personal archetype and explainable "ForYou Fit" profile, then returns exactly **five concrete moves**.

The product improves over time by tracking which moves the creator tries, what happens afterward, and which hypotheses about that creator become stronger or weaker.

The core loop is:

**observe → diagnose → recommend → act → measure → update the playbook**

This is not a generic analytics dashboard and not a "viral post score." It is a living strategy guide for one creator.

---

## 2. Why Now

X has published substantially more of its For You ranking implementation, including production ranking-weight configuration and documentation of the 2026 bidirectional-follow boost.

This creates a short-lived launch opportunity: creators are actively curious about "the algorithm," but most tools either explain the system in the abstract or offer generic social analytics.

ForYou Playbook turns that curiosity into a personalized product.

### Current-regime analysis window

For v0.1:

- `CURRENT_REGIME_START = 2026-07-31T00:00:00Z`
- This must be a configuration value, not hard-coded throughout the app.
- Public copy should say "since the latest For You changes" unless we have an authoritative source for the exact public date we name.

Important upstream note: the xai-org/x-algorithm repository's own `docs/BIDIRECTIONAL_BOOST_CHANGE.md` documents:
- A/B test beginning July 10, 2026
- broad launch on July 13
- boost adjusted from 20 to 15 on July 24

The product-selected July 31 boundary is therefore a practical "current regime" cutoff, not something we should falsely present as the single canonical upstream rollout date.

---

## 3. Product Thesis

The production ranker is viewer-specific. We cannot honestly calculate:

> "X gives your post a ranking score of 82."

We can calculate something more useful:

> "Given the people X showed your content to, which behaviors did it generate, how does that line up with the behaviors X says it values, and what patterns are specific to you?"

This creates three evidence layers in the UI:

### X says
Facts grounded in the open-source ranking implementation.

Example:
> Replies and quotes are substantially stronger ranking signals than likes in the published scoring configuration.

### Your data says
Observed metrics from the creator's own X posts.

Example:
> Posts that begin with a technical claim generate 1.6× your median reply rate.

### Your Playbook thinks
An inference generated from repeated evidence.

Example:
> Lead with the conclusion when you're posting about agent architecture.

Every inference has a confidence level and supporting examples.

---

## 4. Target User

### v0.1 primary user

An individual creator who:
- posts publicly on X;
- has at least some original-post history;
- cares about reach, conversations, authority, audience growth, or driving curiosity;
- wants specific advice rather than a dashboard;
- is willing to connect their X account for personalized analysis.

Typical examples:
- developers and technical creators;
- founders;
- writers;
- researchers;
- independent creators;
- people who use X as a professional/public thinking surface.

### Not v0.1

Do not optimize for:
- brand social teams;
- agencies managing many accounts;
- enterprise social listening;
- competitive intelligence;
- political persuasion tooling;
- autonomous social bots.

---

## 5. Goals

### Launch goals

1. Create a "wow, it knows my account" reveal within the first session.
2. Make the result fun enough that users voluntarily share it.
3. Give every qualified creator exactly five useful actions.
4. Make at least one action easy to take immediately.
5. Create a reason to come back after the user posts again.
6. Clearly distinguish source-code facts, observed data, and model inference.
7. Keep X API cost bounded and predictable.

### North-star product metric

**7-day return rate among users who accepted at least one Playbook move.**

The product succeeds when users use the advice, return to see what happened, and update their Playbook.

### Supporting metrics

- X OAuth completion rate
- Scan completion rate
- Reveal completion rate
- Share-card rate
- % users who open at least one Move
- % users who mark a Move "I'm trying this"
- Rewrite copy/use rate
- Experiment enrollment rate
- 7-day return rate
- Playbook rules strengthened/retired over time
- Referral scans originating from shared Playbook pages

---

## 6. Non-Goals

v0.1 will NOT:

- reproduce X's real viewer-specific production rank score;
- promise virality;
- autonomously publish, reply, follow, like, or DM;
- schedule posts;
- infer unobservable negative-feedback counts such as reports, mutes, or "not interested";
- claim to observe DM shares or copy-link shares if the API does not expose them;
- depend on Enterprise-only X analytics;
- optimize users toward spam or engagement bait;
- create a generic "best time to post" dashboard;
- do competitor benchmarking;
- expose a giant wall of social-media charts.

---

## 7. Product Personality

The agent should feel like:

**curious + mischievous + silly + evidence-obsessed**

Not:
- corporate;
- smug;
- guru-ish;
- "growth hacker";
- overly certain.

### Voice examples

Good:
- "👀 okay, I found something."
- "Likes are kind of lying to you here."
- "This post escaped containment."
- "You apparently cannot resist explaining agent architecture. Good news: neither can your audience."
- "I have a theory."
- "Experiment result: WINNER 🧪"
- "Playbook rule unlocked ✨"
- "I regret to inform you that your hot takes outperform your announcements."

Bad:
- "Your content strategy should leverage synergistic audience engagement."
- "Post controversial content to maximize comments."
- "Guaranteed 3.2× reach."
- "The algorithm score for this tweet is 87."

---

## 8. Core Experience

The product has four acts.

### Act I — See the Algorithm

Retain the best parts of the Inside the For You experience:

- Scoring Lab
- Annotated demo feed
- Action effects
- Weight Playground
- Deep-dive explanation

The core page should remain playful and tactile.

Primary transition CTA:

> **okay, but this isn't *your* algorithm 👀**  
> X builds every For You feed differently.  
> Let's see what happens when people encounter *you*.  
> **Build my ForYou Playbook →**

This is the conceptual bridge between Nader's project and ours.

### Act II — The Scan

User connects X with OAuth.

While analysis runs, the product shows real pipeline stages with silly copy:

1. `fetching_posts`
   - "🔎 reading the receipts"
2. `normalizing_metrics`
   - "📐 making likes stop bossing everyone around"
3. `extracting_patterns`
   - "🧠 figuring out what you won't shut up about"
4. `testing_hypotheses`
   - "👀 found something weird"
5. `building_moves`
   - "🎮 picking your next five moves"
6. `rendering_playbook`
   - "📖 writing your playbook"

Do not fake progress percentages. Show completed stages.

Offer:
> **Email me when my Playbook is cooked 🍳**

Email is optional. Do not request X email scope merely for this. Ask for an email address if the user chooses notification.

While the scan runs, ask one optional personalization question:

> **What are you hoping X does for you right now?**
> - Start better conversations
> - Grow my audience
> - Get people curious about my work
> - Drive clicks to my work
> - Just tell me what you find 👀

Default: balanced / "tell me what you find."

### Act III — The Reveal

The reveal should be editorial, not dashboard-first.

Order:

1. Archetype
2. One surprising headline finding
3. ForYou Fit profile
4. Three evidence-backed discoveries
5. Five Moves
6. Playbook rules
7. Share card

Example:

> # @sugaroverflow's ForYou Playbook
>
> ## 🔥 The Technical Instigator
> **You start conversations, create profile curiosity, and are weirdly bad at announcements.**
>
> 22 posts studied · confidence: high

Then:

> ## 👀 I found something.
> Your technical posts get fewer likes than your career posts, but generate 2.3× more profile curiosity.
>
> **Likes are lying to you.**

### Act IV — The Loop

The user chooses one or more Moves.

They can:
- "I'm doing this"
- copy a rewrite
- start an experiment
- dismiss a bad recommendation
- tell the agent "not my vibe"

The next time new posts are detected:

> ## 🧪 Experiment result
> **Lead with the conclusion**
>
> Tried across 4 posts
> Reply rate ↑
> Profile curiosity ↑
>
> **PLAYBOOK RULE UNLOCKED ✨**
> Lead with the take. Explain yourself later.
>
> Confidence: 82%

---

## 9. Data Acquisition

### Authentication

Use OAuth 2.0 Authorization Code with PKCE.

Minimum scopes:
- `tweet.read`
- `users.read`
- `offline.access` if we want incremental refresh without repeated sign-in

Do NOT request:
- `tweet.write`
- `like.write`
- `follows.write`
- DM scopes

v0.1 is recommendation-first and read-only.

### Initial user lookup

Fetch authenticated user:
- X user ID
- username
- display name
- profile image
- public metrics such as follower count

### Post timeline

Use:
`GET /2/users/{id}/tweets`

Parameters:
- `start_time = CURRENT_REGIME_START`
- exclude retweets
- do NOT use `exclude=replies` because that lowers the documented maximum retrieval volume
- `max_results=100`
- paginate until cutoff reached or cost governor fires

Requested fields should include, where available:
- id
- text / note_tweet
- created_at
- public_metrics
- non_public_metrics
- conversation_id
- referenced_tweets
- entities
- lang
- attachments/media expansions

Classify client-side:
- original
- reply
- quote
- repost

### Primary analysis cohort

ForYou Fit:
- original posts
- quote posts

Replies:
- analyzed separately as creator behavior / conversation style
- do not mix directly into original-post performance scores

Reposts:
- ignored for creator-content scoring

### Current X API availability

Pay-per-use timeline data gives us public metrics such as:
- likes
- replies
- reposts
- quotes
- bookmarks
- impressions

For creator-owned posts within X's private-metric availability window, user-context requests can also provide:
- impressions
- profile clicks
- URL link clicks
- engagements

X's richer `/2/tweets/analytics` endpoint includes follows, shares, detail expands and other metrics but is Enterprise-only. Do not make v0.1 depend on it.

### Critical launch behavior: snapshot private metrics

X documents non-public metrics as available only for posts from the last 30 days.

Therefore:

**Persist the private metrics we legitimately retrieve at scan time.**

The July 31 regime window is currently still inside that 30-day availability period. This is a launch advantage.

For returning users:
- use `since_id` to ingest only new posts;
- snapshot fresh creator metrics while the posts remain eligible;
- maintain compliance with X requirements for stored content and deletion/modification.

---

## 10. Sample-Size Logic

The product must degrade gracefully.

### Full Playbook
At least 15 qualifying original/quote posts since cutoff.

Output:
- archetype
- Fit profile
- discoveries
- five Moves
- rule confidence
- experiments

### Early Playbook
8–14 qualifying posts.

Output:
- same product experience
- confidence badge: Medium
- phrase findings as early patterns
- optionally use older content *only for voice/topic/style understanding*, not current-regime performance scoring

Example:
> "I have enough to form theories, not enough to become unbearable about them."

### Tiny sample
1–7 qualifying posts.

Output:
- archetype marked provisional
- no strong numeric performance claims
- five low-risk experiments based on current X incentives + available evidence
- optional 30–60 day style scan if cost budget allows

Example:
> "Your Playbook is still a baby. I found a few clues, but I'm not pretending six posts are a scientific civilization."

### No data
Show playground + explain what is needed.

---

## 11. Metrics and Derived Features

### Base rates

For each post with impressions:

- like_rate = likes / impressions
- reply_rate = replies / impressions
- repost_rate = reposts / impressions
- quote_rate = quotes / impressions
- bookmark_rate = bookmarks / impressions
- profile_click_rate = profile_clicks / impressions (when available)
- url_click_rate = url_clicks / impressions (when available)
- engagement_rate = engagements / impressions (when available)

Display user-facing rates as per-1,000 impressions when that is easier to understand.

### Content features

Deterministic:
- post type
- character count
- long-form / note post
- URL present
- media type
- thread starter
- question mark
- @mentions
- hashtags
- posting timestamp/day

LLM-extracted:
- topic(s)
- opening style:
  - claim
  - question
  - context/setup
  - story
  - announcement
  - list
  - link lead
- content mode:
  - opinion
  - explainer
  - announcement
  - personal
  - commentary
  - tutorial
  - event recap
  - promotion
- specificity
- concrete example present
- standalone value
- call-to-action type
- tone
- recurring series / motif
- likely creator intent

Do not infer sensitive traits.

### Post maturity

Very fresh posts can distort comparisons.

Initial rule:
- under 6 hours: `pending`, excluded from stable findings
- 6–24 hours: included with lower confidence
- 24h+: stable enough for v0.1 comparisons

Make these thresholds config values.

---

## 12. X-Algorithm Grounding

Source of truth:
`xai-org/x-algorithm`

Relevant pieces include:
- `home-mixer/params/param.rs`
- `home-mixer/scorers/ranking_scorer.rs`
- `docs/BIDIRECTIONAL_BOOST_CHANGE.md`
- candidate source/retrieval docs
- filtering/visibility code

The ranking implementation combines model-predicted probabilities of viewer actions using configured weights.

Important product rule:

**Never multiply a creator's observed raw engagement counts by production ranking weights and call the result an X score.**

The weights apply to predicted viewer-action probabilities in the ranking pipeline, not raw creator analytics.

### v0.1 signal tiers

Use the published weights to establish *qualitative signal importance*, not to pretend we have the production score.

Example internal tiers:
- LOW: likes, basic opens/media signals
- MEDIUM: reposts, generic shares
- HIGH: replies, quotes, follow-author style outcomes
- VERY HIGH / CONTEXTUAL: mutual-follow reply boost
- SEVERE NEGATIVE: report/mute/not-interested classes

Only use observable signals in creator scoring.

Unobservable signals can appear as educational context:
> "X strongly penalizes negative feedback, but your creator analytics do not expose those events, so they are not included in your score."

---

## 13. ForYou Fit

### Product intent

ForYou Fit is **our explainable alignment index**, not X's score.

It answers:

> How effectively are your recent posts generating observable behaviors that line up with the current For You incentives?

### Visible dimensions

#### 1. Conversation
Observed:
- reply rate
- quote rate

Context:
- X's current code strongly rewards reply probability, with an additional bidirectional-follow boost in the documented 2026 change.

#### 2. Travels
Observed:
- repost rate
- bookmark rate

Context:
- sharing-style outcomes matter, but DM share and copy-link signals may not be observable in pay-per-use creator metrics.

#### 3. Curiosity
Observed when available:
- profile click rate
- URL click rate
- engagement rate

Fallback:
- label confidence lower when non-public metrics are unavailable.

#### 4. Reach
Observed:
- impressions
- impressions relative to the creator's own post distribution
- reach by content/topic/format

Do not frame reach as a pure quality measure.

#### 5. Momentum
Observed:
- recent posts vs earlier posts inside the current-regime window
- directional trend rather than universal benchmark

### Fit calculation philosophy

v0.1 should prioritize honesty over mathematical theater.

Rules:
1. Normalize action rates by impressions.
2. Use robust statistics: medians, percentiles, and shrinkage for tiny samples.
3. Compare the creator to their own observed behavior whenever possible.
4. Weight signal families by qualitative ranking importance, not literal production coefficients.
5. Attach a confidence level.
6. Keep the numeric overall Fit behind a feature flag until it passes sanity checks.

If the overall 0–100 score feels arbitrary in testing, ship the dimension profile without the single number. The archetype + discoveries + Moves are the product; the number is decoration.

### Fit disclaimer

Small tooltip:

> ForYou Fit is a ForYou Playbook index built from your observable X metrics and X's published ranking incentives. It is not an X ranking score and cannot predict how every viewer's feed will rank a post.

---

## 14. Archetypes

Archetype is the shareable emotional hook.

It should combine:
- strongest observed behavior profile;
- dominant content style;
- recurring topic/format traits;
- playful language.

Examples:
- 🔥 The Technical Instigator
- 📚 The Quiet Reference Manual
- 🧨 The Polite Provocateur
- 🧪 The Public Lab Notebook
- 🕳️ The Rabbit-Hole Merchant
- 📣 The Reluctant Broadcaster
- 🧵 The Thread Professor
- 👹 The Reply Goblin

Archetypes must not infer sensitive traits or insult users.

### Generation approach

Prefer constrained generation:
- deterministic trait vector
- model generates 3 candidate names
- safety/style filter
- choose one
- generate one-sentence description

Persist the archetype version so shared cards do not change randomly on refresh.

---

## 15. Discoveries

Reveal exactly three top findings before the five Moves.

A finding needs:
- headline
- evidence
- why it matters
- confidence
- supporting post IDs

Example:

> **Likes are lying to you.**
>
> Your agent architecture posts get 22% fewer likes per impression than your career posts, but 2.1× more profile clicks.
>
> **Why I care:** profile curiosity is a better match for your stated goal than passive approval.
>
> Confidence: High · 9 posts

Finding selection should favor:
1. surprising contrast;
2. repeated pattern;
3. actionable implication;
4. sufficient sample.

Avoid tautologies like:
> "Posts with more impressions got more likes."

---

## 16. The Five Moves

Every scan returns **exactly five**.

This creates a recognizable product ritual.

### Move 1 — Rewrite this ✍️

Pick:
- a recent underperformer with a clear opportunity; or
- a post that got one kind of engagement but missed another.

Return:
- original
- diagnosis
- target behavior
- rewritten version
- "what changed"
- Copy button
- "Not my voice" feedback

Never promise a specific ranking lift.

### Move 2 — Double down 🔥

Identify one winning pattern.

Example:
> "Technical claim + concrete example is your strongest conversation pattern. Write another one this week."

Include:
- evidence count
- best examples
- suggested prompt/topic

### Move 3 — Change this 🛑

One account-level habit.

Examples:
- stop burying the claim under event context;
- reduce link-first openings;
- split announcement + insight into separate posts;
- stop turning every strong observation into a reply.

Phrase as an experiment when confidence is not high.

### Move 4 — Go talk 💬

One conversation action, not spam.

v0.1 options:
- return to a high-performing conversation and reply thoughtfully;
- turn a strong reply into a standalone post;
- quote a relevant conversation with a new insight;
- continue a thread that generated unusually strong replies.

We do not need to identify specific strangers in v0.1 if doing so requires expensive reply graph ingestion.

### Move 5 — Run this experiment 🧪

A bounded hypothesis.

Example:
> For your next three technical posts, put the conclusion in sentence one instead of setting up the context.

Experiment contains:
- hypothesis
- metric(s)
- number of posts
- completion condition
- comparison baseline
- expected decision

User can choose:
> **I'm trying this**

---

## 17. Experiment Loop

### Experiment states

- proposed
- accepted
- active
- enough_data
- winner
- loser
- inconclusive
- retired

### Measurement

When the user returns or scheduled refresh occurs:
- fetch new posts with `since_id`;
- detect likely experiment posts using date + semantic/content criteria;
- allow user to confirm which posts count;
- compare against the relevant creator baseline.

Do not silently claim a post was part of an experiment if uncertain.

### Rule update

Winning experiments can:
- create a new Playbook Rule;
- strengthen an existing rule;
- weaken/retire a contradictory rule.

Example:
> **RULE #7 strengthened**
>
> Lead with the take, then explain.
>
> Evidence: 11 posts + 2 experiments  
> Confidence: 88%

---

## 18. Playbook Rules

A rule is a persistent hypothesis about this creator.

Schema:

```ts
type PlaybookRule = {
  id: string
  userId: string
  title: string
  description: string
  category: "topic" | "format" | "hook" | "media" | "conversation" | "habit"
  status: "candidate" | "active" | "retired"
  confidence: number
  evidencePostIds: string[]
  counterexamplePostIds: string[]
  experimentIds: string[]
  createdAt: string
  updatedAt: string
}
```

Examples:
- "Agent-system posts create profile curiosity even when likes are average."
- "Opinion → concrete example beats context → explanation."
- "Event recap + external link is weak for you."
- "Questions do not outperform declarative hooks on your account."

The agent should be allowed to say:
> "Everyone says to ask questions. Your data disagrees."

That is a core personalization moment.

---

## 19. Sharing

Sharing is a first-class acquisition loop.

### Default share card

Public:
- display name / @handle only with consent
- archetype
- 3–4 Fit dimensions
- one funny Playbook rule
- number of posts studied
- ForYou Playbook branding
- CTA: Build yours

Never expose:
- private metrics;
- email;
- full post archive;
- private analysis;
- unpublished experiments;
- exact internal strategy unless user selects it.

### Example

> **apparently my X archetype is**
>
> 🔥 THE TECHNICAL INSTIGATOR
>
> Conversation 91  
> Travels 68  
> Curiosity 86
>
> **My weirdest rule:**  
> "Questions underperform your hot takes."
>
> foryouplaybook.com

### Share UX

Buttons:
- Share to X
- Copy link
- Copy image

Use X Web Intent for Share to X so v0.1 does not require `tweet.write`.

### Public Playbook route

`/p/{publicSlug}`

Contains:
- archetype
- share-safe dimensions
- one user-selected rule
- CTA

User controls public/private.

---

## 20. Email

Email is not the product; it is completion + return glue.

### Scan-complete email

Subject options:
- Your Playbook is cooked 🍳
- 👀 I found something
- Your ForYou archetype has entered the chat

Body:
- archetype tease
- one finding
- View Playbook CTA

### Return email

Only when useful:
- experiment has enough data;
- a Playbook rule changes materially;
- weekly Five Moves if user opts in.

Do not spam daily analytics digests.

---

## 21. Information Architecture / Routes

Suggested routes:

- `/` — landing + algorithm playground
- `/playground` — optional dedicated full playground
- `/connect` — OAuth start
- `/scan/{scanId}` — scan progress
- `/playbook` — authenticated current Playbook
- `/playbook/moves` — Five Moves
- `/playbook/rules` — learned rules
- `/playbook/experiments` — experiments
- `/p/{slug}` — share-safe public reveal
- `/settings` — privacy, refresh, email, disconnect/delete

---

## 22. Technical Architecture

### Fastest path from Nader's repo

Keep:
- React
- TypeScript
- Vite
- Framer Motion
- Cloudflare Worker
- Wrangler deployment

Nader's code is already small and interaction-heavy, making it a strong launch shell.

### Add

**Cloudflare Worker**
- OAuth callbacks
- X API client
- scan API
- LLM analysis
- public share endpoints

**Database**
Cloudflare D1 is a natural fast-path choice for:
- users
- auth tokens (encrypted)
- posts / snapshots
- scans
- features
- findings
- moves
- rules
- experiments

**Queue / async job**
Use a queue-backed scan because:
- account scan may require pagination;
- content analysis can require several model calls;
- user can leave and receive email.

**Email provider**
Provider abstraction; choose fastest reliable transactional email service.

**LLM provider**
Provider abstraction.
Nader already uses xAI/Grok in the repo for playful algorithm naming, making xAI the lowest-friction initial default if desired.

Do not train a model on X data. Use inference for the connected user's requested analysis and review current X developer-policy requirements before production launch.

### Suggested services

```text
React/Vite app
      |
Cloudflare Worker
      |
      +-- X OAuth / X API
      +-- Scan Queue
      +-- D1
      +-- LLM provider
      +-- Email provider
```

---

## 23. Scan Pipeline

```text
START
 |
 |-- authenticate user
 |-- fetch user profile
 |-- fetch posts since CURRENT_REGIME_START
 |-- snapshot public/private metrics
 |-- classify post types
 |-- exclude immature posts from stable claims
 |-- calculate metric rates
 |-- deterministic content features
 |-- LLM content feature extraction
 |-- cluster topics/formats
 |-- detect winners / underperformers / contrasts
 |-- map findings to X signal families
 |-- generate candidate hypotheses
 |-- validate each hypothesis against evidence
 |-- pick 3 discoveries
 |-- derive archetype
 |-- generate exactly 5 Moves
 |-- persist Playbook
 `-- notify user
```

### Important design principle

LLM does not perform arithmetic from raw data.

Compute metrics deterministically. Give the model a structured evidence summary and candidate post excerpts.

The model writes:
- interpretations;
- labels;
- playful copy;
- recommendations;
- rewrites.

The code decides:
- counts;
- rates;
- comparisons;
- confidence inputs.

---

## 24. Data Model

Minimum tables:

### users
- id
- x_user_id
- username
- display_name
- profile_image_url
- follower_count
- oauth_token_encrypted
- oauth_refresh_token_encrypted
- email
- goal
- public_slug
- share_enabled
- created_at
- last_scanned_at

### posts
- id
- user_id
- x_post_id
- text
- post_type
- created_at
- has_url
- media_type
- conversation_id
- fetched_at

### metric_snapshots
- id
- post_id
- captured_at
- impressions
- likes
- replies
- reposts
- quotes
- bookmarks
- engagements nullable
- profile_clicks nullable
- url_clicks nullable

### post_features
- post_id
- deterministic_json
- semantic_json
- feature_version

### scans
- id
- user_id
- status
- stage
- post_count
- qualifying_post_count
- cost_estimate
- started_at
- completed_at
- algorithm_snapshot_version

### findings
- id
- scan_id
- headline
- explanation
- confidence
- evidence_json

### moves
- id
- scan_id
- move_type
- title
- body
- evidence_json
- rewrite_text nullable
- status
- accepted_at

### playbook_rules
As defined above.

### experiments
- id
- user_id
- move_id
- hypothesis
- target_metrics_json
- baseline_json
- status
- started_at
- completed_at
- outcome_json

---

## 25. API / Backend Endpoints

Possible app endpoints:

```text
GET  /api/auth/x/start
GET  /api/auth/x/callback

POST /api/scans
GET  /api/scans/:id
GET  /api/playbook

POST /api/moves/:id/accept
POST /api/moves/:id/dismiss
POST /api/moves/:id/feedback

POST /api/experiments/:id/confirm-post
GET  /api/experiments

POST /api/share
GET  /api/public/:slug

POST /api/settings/email
POST /api/settings/delete
```

---

## 26. Cost Controls

Current X pay-per-use pricing should be read from current docs/config before launch; as of this spec's research, a Post read is $0.005/resource and user reads are $0.010/resource.

### v0.1 safeguards

- Current-regime window only.
- Initial post-read soft cap: 200.
- Hard cap: 400 without sampling.
- Estimated X spend cap per initial scan: `$2.00`.
- If post volume exceeds cap:
  - prioritize original + quote posts;
  - include replies as a sampled behavior set;
  - sample high-volume days rather than failing.
- Cache fetched resources.
- Use X's 24-hour dedup behavior but do not rely on it as the only budget control.
- Fetch incrementally with `since_id`.
- Set an account-level X API spending limit in Developer Console.
- Log estimated cost per scan.

Most normal creators should be far below the hard cap when scanning only from July 31.

### Enterprise analytics

Do not purchase Enterprise just to launch this concept.

Validate demand using pay-per-use metrics first.

---

## 27. Privacy / X Compliance

Before public launch:

- clear privacy policy before sign-up;
- explicitly explain that the creator is authorizing analysis of their own X content and metrics;
- minimal OAuth scopes;
- encrypted OAuth token storage;
- account disconnect + delete function;
- do not expose one user's authenticated X content to another;
- honor X content deletion/modification requirements;
- maintain a compliance strategy for stored X content;
- do not infer sensitive characteristics;
- do not train AI/ML models on X content;
- keep share pages opt-in and share-safe;
- use proper X attribution/display rules if full posts are publicly rendered.

Avoid sending unnecessary X content to third parties.

---

## 28. Fork / Attribution Strategy

Upstream project:
`dabit3/insidetheforyou`

The repo is public and contains the exact launch shell we want:
- React/Vite
- Scoring Lab
- demo feed
- action effects
- Weight Playground
- deep dive
- Cloudflare Worker / Grok playful naming

However, the repository currently does not expose an obvious LICENSE file in its root.

### Plan

1. Create/maintain a GitHub fork for experimentation and visible lineage.
2. Ask Nader to confirm permission / add a permissive license before publicly deploying derivative source.
3. Preserve conspicuous attribution:
   > Inspired by / built from Inside the For You by Nader Dabit.
4. If permission/license is not available quickly:
   - reimplement the relevant interactions;
   - ground the algorithm data directly in `xai-org/x-algorithm`, which has its own upstream license;
   - credit Inside the For You as inspiration without copying its implementation.

### Builder-to-builder positioning

The public story should feel collaborative:

> "Inside the For You made the algorithm understandable. It made me wonder: what if the playground knew who you were?"

Not:
> "We made a better version of his site."

---

## 29. Launch Homepage

### Hero

> # See how For You works.
> ## Then see how it works for you.
>
> X opened up more of the algorithm.  
> Play with it. Then connect your account and I'll build a Playbook from what actually works for *you*.
>
> **Test the algorithm ↓**
> **Build my Playbook →**

### Mid-page transition

After the playground:

> ## okay, I give you one better 👀
>
> The ranker doesn't score every post the same way for every person.
>
> So a universal "algorithm score" would be nonsense.
>
> But your own posts leave evidence.
>
> **Let me read the receipts.**

---

## 30. Launch Reveal Example

```text
@sugaroverflow's ForYou Playbook

🔥 THE TECHNICAL INSTIGATOR

You start technical arguments, create profile curiosity,
and are mysteriously terrible at announcements.

22 posts studied · since Jul 31 · HIGH confidence

👀 I FOUND SOMETHING

Your agent architecture posts get fewer likes than your
career posts, but generate 2.1× more profile clicks.

Likes are lying to you.

YOUR FORYOU PROFILE

Conversation     87
Travels          63
Curiosity        91
Reach            74
Momentum         ↑

YOUR FIVE MOVES

1. ✍️ REWRITE THIS
   This launch post got approval but almost no conversation.
   [rewrite]

2. 🔥 DOUBLE DOWN
   Claim + concrete example is your strongest technical pattern.

3. 🛑 CHANGE THIS
   Your event recap posts bury the interesting sentence.

4. 💬 GO TALK
   Turn your best reply from this week's thread into an original post.

5. 🧪 RUN THIS EXPERIMENT
   Lead with the conclusion on your next 3 agent posts.

[ I'm trying this ]

PLAYBOOK RULES

#3 Agent architecture creates profile curiosity    86%
#7 Lead with the take, then explain                 72%
#9 Questions beat statements                        RETIRED

[ Share my archetype ]
```

---

## 31. v0.1 Launch Scope

### MUST ship

- Nader-style playground shell
- X OAuth
- current-regime post ingestion
- public metrics
- available creator non-public metrics
- scan progress
- optional scan-complete email
- content classification
- three discoveries
- archetype
- Fit dimensions
- exactly five Moves
- rewrite
- accept/dismiss Move
- basic Playbook Rules
- one experiment type
- share card / share page
- X Web Intent
- API cost governor
- privacy/delete flow
- attribution

### SHOULD ship

- dynamic confidence
- experiment outcome screen
- rule unlock animation
- public/private share toggle
- scan version tied to algorithm snapshot
- simple incremental refresh

### CUT for trend speed

- autonomous posting
- scheduler
- competitor analysis
- follower graph analysis
- deep mutual-follow reply graph
- Enterprise analytics
- mobile app
- browser extension
- team accounts
- billing/subscriptions
- global benchmark percentile
- elaborate notifications
- dozens of chart types

---

## 32. v0.2 After We Know People Care

- weekly refreshed Five Moves
- mature experiment engine
- stronger before/after comparisons
- topic-specific Playbook pages
- "rule strengthened / retired" history
- richer media/video analysis
- mutual/network analysis where API cost and permissions make sense
- global anonymized benchmarks, only if policy/compliance permits
- paid continuous Playbook
- algorithm-snapshot comparison when X publishes a new diff

Potential killer feature:

> **The algorithm changed. Here's which 3 rules in your Playbook just became stale.**

---

## 33. Monetization Hypothesis

Do not put billing in the launch critical path.

### Free launch
- first Playbook
- archetype
- three discoveries
- Five Moves
- one rewrite
- share card

### Future paid
- continuous monitoring
- weekly Five Moves
- unlimited rewrites
- experiments
- Playbook history
- algorithm-change alerts
- deeper scans

The free Playbook is acquisition. Persistence is the paid value.

---

## 34. Acceptance Criteria

A creator with sufficient posts can:

1. land on foryouplaybook.com;
2. understand the For You mechanics through the playground;
3. connect X with read-only OAuth;
4. leave while their scan runs;
5. optionally receive an email when complete;
6. return to a reveal that names a playful archetype;
7. see at least one non-obvious evidence-backed finding;
8. understand what is "X says" vs "your data says" vs "Playbook inference";
9. receive exactly five concrete Moves;
10. copy a rewrite;
11. accept one experiment;
12. share a safe public card;
13. return after posting;
14. see new metrics incorporated;
15. see a rule strengthen, weaken, or remain inconclusive.

No screen should imply we know a universal production ranking score.

---

## 35. Build Order

### Slice 1 — Fork + transition
- fork/or reproduce Inside the For You shell
- brand ForYou Playbook
- preserve playground
- add "run it on me" transition

### Slice 2 — X auth + raw scan
- OAuth PKCE
- user profile
- timeline ingestion from cutoff
- metrics persistence
- scan progress UI

### Slice 3 — Deterministic analysis
- post classification
- rates
- content features
- winner/loser contrasts
- confidence engine

### Slice 4 — Playbook agent
- semantic features
- discoveries
- archetype
- Five Moves
- rewrite

### Slice 5 — Reveal + virality
- polished reveal
- share card
- public route
- Share to X

### Slice 6 — Memory
- Move acceptance
- one experiment flow
- incremental refresh
- first Rule unlock

### Slice 7 — Launch safety
- cost cap
- privacy
- data deletion
- attribution/license resolution
- error handling
- observability

---

## 36. Open Questions That Do NOT Block v0.1

- Do we show a single overall ForYou Fit number or only dimensions?
  - Feature flag it.
- Exact name of each archetype.
  - Generate/test during build.
- Email provider.
  - Implementation detail.
- Exact LLM provider.
  - Keep abstraction; xAI is natural for the fork.
- Paid price.
  - Not a launch problem.
- Whether July 31 remains the public wording.
  - Keep the internal cutoff configurable.

---

## 37. One-Sentence Product Definition

> **ForYou Playbook reads your posts under X's current For You regime, finds the patterns that are uniquely working for you, gives you five moves to try next, and learns from what happens.**

## 38. Product Mantra

> **The algorithm is global. The Playbook is yours.**
