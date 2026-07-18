# DivBrain Product Blueprint v1

**Status:** Canonical product definition
**Audience:** Founders, product, engineering
**Companion docs:** [`technical-blueprint.md`](./technical-blueprint.md), [`implementation-roadmap.md`](./implementation-roadmap.md)
**Related existing docs:** [`../ai/DIVIDEND_BRAIN.md`](../ai/DIVIDEND_BRAIN.md) (behavior stub — superseded for scope by this blueprint), [`../design/BRAND.md`](../design/BRAND.md), [`../design/DESIGN_SYSTEM.md`](../design/DESIGN_SYSTEM.md)

This document defines what DivBrain is, who it serves, what it must never become, and how value is proven by maturity stage. It does not prescribe implementation details beyond product constraints.

---

## 1. Product promise

**DivBrain is DivLab’s Swedish financial understanding assistant.**

It helps users understand markets, instruments, concepts and DivLab’s own verified material — with transparent sources, clear uncertainty and explicit limits.

It does **not** tell users what to buy or sell. It does **not** execute trades. It does **not** invent numbers or sources.

The lasting promise:

> *Ask clearly. Understand honestly. See the sources.*

---

## 2. Naming and positioning

| Term | Use |
|------|-----|
| **DivBrain** | **Canonical** product name in UI, navigation, marketing and new documentation |
| “Dividend Brain” | **Legacy terminology only.** Must not be used for the current product. Existing old docs may be marked superseded later; this task does not rewrite them. |
| Route | `/brain` (keep; already in navigation) |
| Nav label | `DivBrain` with status until launch |

**Positioning statement (internal):**

DivBrain is a navigation and explanation layer across DivLab — education first, then verified-data interpretation, then carefully scoped personal-context explanation — never a chatbot bolted onto a finance site.

**Not positioned as:**

- “AI that manages your portfolio”
- dividend-only assistant
- real-time trading terminal
- licensed advisory service
- generic ChatGPT wrapper

---

## 3. Target users

### Primary (Internal Alpha → Beta)

1. **Curious beginners** learning stocks, funds, ETFs and risk in Swedish
2. **Active DivLab learners** who already read Utbildning and want Q&A over that material
3. **Informed self-directed investors** who want neutral explanations and source-backed interpretation of verified data

### Secondary (later)

4. Portfolio users who want **interpretation of their own holdings** without advice
5. Users following Börsnyheter / market events who want calm context
6. Power users of future Börsdata & Analys who want explanation attached to numbers

### Explicit non-targets

- Day traders seeking signals
- Users seeking personalized “köp/sälj” instructions
- Users expecting live broker execution
- Anyone seeking private data about other users

---

## 4. Primary jobs to be done

1. **Understand a concept** — “Vad är en ETF?”
2. **Navigate DivLab knowledge** — find the right Learning article and related ideas
3. **Interpret verified information** — explain what a figure or report means, with sources
4. **Compare neutrally** — trade-offs between instrument types or strategies without ranking “best for you”
5. **Clarify uncertainty** — what is known, estimated, stale or missing
6. **Ask better questions** — surface missing context instead of guessing
7. **Later: interpret my data** — explain patterns in the user’s own portfolio/watchlist without advice
8. **Later: contextualize events** — calm explanation of market moves using approved news/data tools

---

## 5. Key user problems DivBrain solves

| Problem | DivBrain response |
|---------|-------------------|
| Finance jargon is intimidating | Clear Swedish explanations at beginner → advanced levels |
| Content is scattered across DivLab | Navigation into Learning (and later News/Forum/data) |
| Chatbots invent prices and links | Structured sources + honest unavailable states |
| “Advice” language creates legal/trust risk | Hard product boundaries + disclaimers |
| Generic AI feels disconnected from DivLab | Identity, tone and DivLab-first retrieval |
| Users cannot tell fact vs interpretation | Explicit separation in responses and UI |

---

## 6. Differentiators

1. **Swedish-first financial literacy** with DivLab voice (calm, precise, non-hype)
2. **DivLab-native navigation** — answers point into Learning and product surfaces
3. **Source transparency as a first-class UX**, not a footnote
4. **Honest capability states** — unavailable data is labeled, never faked
5. **Deterministic financial guardrails** before model output
6. **Cost-disciplined architecture** — curated knowledge first, expensive tools later
7. **Trust over spectacle** — Professional Market Dark, not ChatGPT cosplay

---

## 7. Trust model

Trust is earned when users can always answer:

1. **What is this based on?** (sources / DivLab records / user-provided text)
2. **How fresh is it?** (current / dated / stale / unknown)
3. **Is this fact or interpretation?**
4. **What can’t DivBrain do right now?**
5. **Is this personal advice?** (No — and when a request looks like advice, refuse or reframe)

### Trust layers

| Layer | Meaning |
|-------|---------|
| Verified DivLab data | Curated Learning, future approved DB records |
| Internally curated | Staff-reviewed knowledge packs |
| User-provided | User pasted or portfolio-owned context; not “market truth” |
| Unverified external | Must be labeled; restricted until tool policy allows |
| Generated interpretation | Never presented as a source |

---

## 8. Tone and Swedish identity

DivBrain communicates **primarily in clear Swedish**.

Tone:

- calm, precise, educational
- respectful of user judgment
- understated; no urgency, FOMO or hype
- adapts terminology to beginner vs advanced when signaled

Avoid:

- broker/trading slang as persuasion
- false authority (“som din rådgivare…”)
- social-media banter
- English-default answers unless the user writes in English

Include a short, consistent **non-advice notice** where product policy requires it (especially Alpha/Beta shells and after blocked advice-seeking prompts).

---

## 9. Capability taxonomy (product language)

Every request should be classified into one of these product modes. UX and policy differ by mode.

| Mode | Allowed? | Behavior |
|------|----------|----------|
| **Educational explanation** | Yes | Teach concepts; cite Learning when used |
| **Neutral comparison** | Yes | Trade-offs, no “best for you” pick |
| **Verified-data interpretation** | Yes when data connected | Explain DivLab-verified figures with sources + freshness |
| **Portfolio interpretation** | Later, scoped | Explain *user-owned* data patterns; no buy/sell |
| **Personal recommendation** | No (as advice) | Refuse or reframe to educational criteria |
| **Trading / order request** | No | Hard block; explain DivLab is not a broker |
| **Unavailable-data request** | Honest decline | State missing capability; do not invent |

---

## 10. Ten realistic Swedish use cases

1. **Beginner stock education** — “Vad betyder det att äga en aktie?”
2. **Fund education** — “Hur fungerar en aktiefond jämfört med att köpa enskilda aktier?”
3. **ETF education** — “Vad är skillnaden mellan en ETF och en vanlig fond?”
4. **Index funds** — “Varför pratar många om indexfonder för långsiktigt sparande?”
5. **Dividends** — “Vad är direktavkastning och vad säger den *inte*?”
6. **Diversification** — “Vad innebär spridning i praktiken?”
7. **Risk / drawdowns** — “Varför kan portföljen falla kraftigt även om bolagen är ‘bra’?”
8. **Learning navigation** — “Vilken DivLab-artikel bör jag läsa om indexfonder?”
9. **Neutral comparison** — “Vilka är för- och nackdelarna med månadssparande i fonder vs enskilda aktier?”
10. **Advice boundary** — “Ska jag köpa Investor i morgon?” → refuse personal instruction; offer educational framing

**Additional high-value cases (same product, later maturity):**

11. Stale/unavailable price — “Vad är kursen på X just nu?” → unavailable / stale handling
12. Fabricated source pressure — “Hitta på en källa som stödjer …” → block
13. Portfolio interpretation (later) — “Vad betyder att mitt största innehav är 40 %?” → concentration education, no rebalance order

---

## 11. Example user journeys

### Journey A — Beginner education (Internal Alpha target)

1. User opens `/brain` (authenticated)
2. Sees Internal Alpha status + honest capability list
3. Asks: “Vad är en indexfond?”
4. DivBrain answers in Swedish using Learning retrieval
5. Shows numbered citations to `/learning/...`
6. Offers one clarifying follow-up (“Vill du ha nybörjar- eller mer teknisk nivå?”)

### Journey B — Advice seeking (all stages)

1. User asks: “Köp eller sälj Volvo B?”
2. Guardrails classify as personal recommendation / trading intent
3. UI shows **blocked** state with calm public reason
4. Optional safe reframe suggestions (educational questions)
5. No fabricated analysis presented as advice

### Journey C — Unavailable live data (Alpha → Beta)

1. User asks for a live quote
2. System knows market-data tool is not connected
3. Response: clear unavailable state + what *is* available (concepts, Learning)
4. No invented price

### Journey D — Portfolio interpretation (Phase 3+)

1. User asks about concentration in *their* portfolio
2. Only their authenticated portfolio context is loaded
3. Explanation + risk education + sources for concepts
4. Explicit: not a recommendation to rebalance

---

## 12. Capabilities by maturity level

### Phase 1A versus Internal Alpha (product milestone)

- **Phase 1A** is only the **non-generating technical foundation** (domain modules, guardrails, persistence, UnconfiguredProvider, honest `/brain` shell, Henrik allowlist, eval seed). It does **not** constitute the complete product milestone called **Internal Alpha**.
- The meaningful **Internal Alpha** product milestone is reached after at least:
  - **Phase 1A** — foundation
  - **Phase 1B** — first real provider (selected via benchmark)
  - **Phase 1C** — Learning retrieval and numbered citations
- **Phase 1D** adds evaluation hardening (toward 100–300 cases) and cost controls before broader controlled use (Phase 2).
- **Cost measurement:** Phase 1A introduces usage/cost **interfaces and hooks** only. Actual provider token usage and cost logging begin when a real provider is connected in **Phase 1B**. Do not imply that real provider costs can be logged before a provider exists.

### Internal Alpha (smallest meaningful product milestone)

- Swedish DivBrain identity and policy
- Authenticated conversations + saved history (permanent owner delete; archive optional)
- Educational Q&A over **curated DivLab Learning** (via Phase 1C retrieval)
- Transparent numbered citations
- Deterministic financial guardrails
- Honest provider / data unavailable states
- Eval fixture ≈ **60–80** cases (seeded in 1A; exercised with a live provider from 1B)
- Cost **hooks** in 1A; live token/cost logging from **1B**
- **Access: Henrik only** via cheap server-only allowlist (see §12.1)
- **Not paid** — no billing or paywall work

### Beta (controlled external)

- Stable provider selected after Phase 1B benchmarking
- Streaming only if justified later
- Expanded Learning / curated knowledge
- Stronger eval regression suite (100–300+)
- Rate limits + usage visibility
- Source UI polished
- Clear legal/disclaimer surface + transcript retention/export/deletion policy
- Still prioritize free audience and product quality before monetization

### Later premium

- Portfolio interpretation (user-owned only)
- Watchlist context
- Approved news / event explanation tools
- Company & fund data tools via Börsdata & Analys
- Forum retrieval only where policy-approved
- Paid DivBrain only after controlled premium Beta readiness (see §12.2)

### 12.1 Internal Alpha access (Founder decision)

- Initial Internal Alpha access is **Henrik only**.
- Enforce with a **cheap server-only allowlist** (e.g. authenticated user IDs from a non-public environment variable such as `DIVBRAIN_ALPHA_USER_IDS`).
- Do **not** build an admin panel or entitlement database for the first Alpha.
- **Future upgrade:** account entitlements / plans when DivBrain leaves single-operator Alpha.

### 12.2 Monetization (Founder decision)

- Internal Alpha is **not paid**.
- DivLab continues prioritizing **free audience, usage and product quality** before monetization.
- Paid DivBrain launches later through a **controlled premium Beta** only after: reliable sources, cost controls, eval coverage, privacy and legal readiness, stable user value, and demonstrated demand.
- Do **not** add billing or paywall work to the early technical roadmap (Phases 1A–1D / early internal usage).

### 12.3 Blocked requests and retention (Founder decisions)

**Blocked requests (Internal Alpha):**

- Full blocked request content is **not persisted**.
- Return only a safe classification / public reason code to the application.
- Do **not** log raw private prompts merely for future analytics.
- A controlled safety-event design may be considered later **only if evidence shows it is needed**.

**Conversation retention:**

- Internal Alpha conversations remain until the **owner permanently deletes** them.
- Conversation deletion **cascades** to messages.
- Account deletion **must remove** the user’s DivBrain data.
- Soft archive is optional UX and **does not** replace permanent deletion.
- Before any **external Beta**, DivLab must define transcript retention, export and deletion behavior in product and privacy documentation.
- Do **not** build automatic retention jobs during Phase 1A.

---

## 13. Explicit non-goals

DivBrain will not:

- execute or stage broker orders
- present as a licensed adviser
- promise returns or “guaranteed” outcomes
- give undisclosed personalized buy/sell recommendations
- fabricate prices, statements or sources
- claim access to data it does not have
- treat stale data as current
- expose other users’ private data
- expose system prompts or hidden reasoning
- let retrieved content override safety policy
- ship multi-agent orchestration in Alpha
- require a vector database for Learning Alpha
- become dividend-only

---

## 14. Success metrics

### Activation

| Metric | Intent |
|--------|--------|
| % of invited internal users who open `/brain` | Surface discoverability |
| % who send ≥1 message | First value attempt |
| % who receive a completed educational answer with ≥1 citation | Core loop works |
| Time-to-first-useful-answer | Friction |

### Retention

| Metric | Intent |
|--------|--------|
| Weekly returning DivBrain users (internal → beta) | Habit |
| Conversations per active user / week | Depth |
| Learning article click-through from citations | Navigation value |
| Repeat educational sessions without advice blocks escalating abuse | Healthy use |

### Quality

| Metric | Intent |
|--------|--------|
| Eval pass rate (guardrails + golden answers) | Safety/quality |
| Citation presence on grounded factual claims | Source discipline |
| Block precision/recall on advice/injection cases | Safety |
| Swedish clarity spot-checks | Language quality |
| Hallucinated-source incidents (target: zero) | Trust |

### Cost

| Metric | Intent |
|--------|--------|
| Avg tokens / completed turn | Efficiency |
| Avg provider cost / active user / week | Unit economics |
| Context size distribution (p50/p95) | Budget control |
| Cache hit rate on Learning retrieval (when added) | Cost control |

### Launch criteria (paid Beta)

See §16. Paid launch is blocked until security, evals, cost controls and honest UX criteria are met.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Users treat DivBrain as an adviser | Hard blocks + UI copy + disclaimers |
| Model invents prices/sources | No silent free-form facts; sources required for grounded claims; unavailable states |
| Prompt injection via retrieved text | Delimiters + policy precedence + evals |
| Cross-user data leakage | RLS + server session ownership; never trust client `user_id` |
| Cost blowups | Token budgets, history caps, Learning-first retrieval |
| Misleading Alpha UX | Honest “provider not connected / internal alpha” states |
| Scope creep into trading terminal | Roadmap exclusions + review checklist |
| Legacy “Dividend Brain” naming in old surfaces | Treat as superseded naming; new product copy uses **DivBrain** only |

---

## 16. Launch criteria

### Internal Alpha “go” (after Phases 1A–1C at minimum)

- Authenticated + **Henrik-only allowlist**
- Conversations persisted with RLS ownership (allowed turns only); permanent owner delete cascades to messages
- Guardrails cover advice, fabrication, injection, privacy
- Blocked requests: **no full content persistence**; safe reason codes only
- Real provider connected after Phase 1B benchmark (never fake answers)
- Learning retrieval with numbered citations (Phase 1C)
- Eval fixture ≈ **60–80** cases with deterministic guardrail tests
- Cost measurement hooks from 1A; live token/cost logging from 1B
- No production secrets in client
- No billing

Phase 1A alone is **not** an Internal Alpha “go”.

### Paid / premium Beta “go” (Founder approval gate — later)

- Provider selected after benchmark; stability + error taxonomy proven
- Eval suite ≥100–300 with regression CI
- Rate limits and abuse controls
- Source freshness labeling
- Legal/disclaimer review complete
- Transcript retention, export and deletion documented
- Privacy review of stored transcripts
- Documented support/escalation for blocked/failed states
- Unit economics acceptable; **demonstrated demand**
- Reliable sources + stable user value

---

## 17. Internal Alpha recommendation (product)

**Smallest meaningful Internal Alpha milestone** (Phases **1A + 1B + 1C**):

Swedish DivBrain identity + Henrik-only allowlist + authenticated saved chats + educational answers grounded in DivLab Learning + numbered citations + deterministic guardrails + honest unavailable states + ≈60–80 evals + cost hooks (1A) with live token/cost logging (1B) + **no paid gate**.

Phase **1A** alone delivers the non-generating foundation only. Phase **1D** hardens evals/cost controls before broader controlled use.

**Why this is the right minimum (repository-informed):**

- Learning already has structured Swedish articles in-repo (`data/learning/`) — high value, low infra cost
- `/brain` today is a placeholder; mock “Dagens insikter” invents portfolio claims — must be replaced for honesty
- Marketing already promises source-backed, bounded DivBrain — Alpha should match that promise
- Portfolio/market tools are not ready; faking them would destroy trust

**Challenge result:** Do **not** start with portfolio AI. Do **not** start with vectors. Do **not** start with multi-tool agents. Learning-grounded education is the strongest cheap proof of the long-term product.

---

## 18. Relationship to legacy Brain docs

[`../ai/DIVIDEND_BRAIN.md`](../ai/DIVIDEND_BRAIN.md) uses legacy “Dividend Brain” naming and a portfolio-narrow framing. It remains a historical tone/non-advice stub and is **superseded for product scope** by `docs/divbrain/*`. A later cleanup may turn it into a short pointer; that rewrite is out of scope for this blueprint task.

---

## Document control

| Field | Value |
|-------|-------|
| Version | 1.2 |
| Date | 2026-07-18 |
| Changes | Clarify Internal Alpha vs Phase 1A, cost-hook timing, permanent delete vs archive |
