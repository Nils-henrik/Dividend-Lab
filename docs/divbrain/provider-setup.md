# DivBrain provider setup (Phase 1B foundation)

**Status:** Integration foundation only — **no production AI activation**  
**Audience:** Founder (Henrik) + engineers  
**Related:** Issue #89 / Ticket 1B-1

This document separates what is **already implemented in code** from **later Founder / Vercel actions** required before real generation is enabled.

---

## Already handled in code

| Area | What exists |
|------|-------------|
| **AI Gateway adapter** | Server-only `AiGatewayProvider` implementing the existing `DivBrainProvider` contract (`lib/divbrain/server/providers/ai-gateway-provider.ts`) |
| **Request mapping** | Ordered context blocks → system prompt; conversation messages → AI SDK messages — never leaked back to the browser |
| **Error normalization** | Timeout/abort → `cancelled`; 429 → `rate_limited`; auth/config → `provider_unavailable`; 5xx/outage → `provider_unavailable`; malformed/empty output → `failed` + catalog error. Raw gateway bodies are never surfaced |
| **Provider factory** | `createDivBrainProvider()` — **defaults to `UnconfiguredProvider`** unless server config explicitly selects `ai-gateway` with a valid model id |
| **Benchmark candidates** | Three families verified against the public AI Gateway catalog at implementation time (see below) |
| **Benchmark harness** | Deterministic local rubric + multi-candidate runner (`lib/divbrain/server/benchmark/**`) |
| **Live safety gate** | `scripts/divbrain-provider-benchmark.mts` requires `DIVBRAIN_PROVIDER_BENCHMARK_LIVE=1` + gateway auth presence; hard-caps cases/tokens; **not** part of `npm test`, Quality Gate, build, or deploy |
| **Tests** | Focused mocked adapter/factory/benchmark tests — CI never incurs model cost |
| **Dependencies** | `ai@7` (Vercel AI SDK / Gateway) + `zod` peer |

### Resolved candidate set (verified)

Queried from `https://ai-gateway.vercel.sh/v1/models` during implementation. All three intended IDs were **present**:

| Family | Model id | Role |
|--------|----------|------|
| OpenAI | `openai/gpt-5.6-luna` | First intended / cost-efficient primary candidate |
| Anthropic | `anthropic/claude-sonnet-5` | Sonnet benchmark candidate |
| Google | `google/gemini-3.6-flash` | Flash benchmark candidate |

Architecture remains **provider-neutral** behind `DivBrainProvider`. OpenAI is first among equals for benchmarking — not a vendor lock-in.

### Runtime default (unchanged)

`UnconfiguredProvider` remains the runtime default. This PR does **not** wire the gateway provider into live `/brain` server actions (deferred until after 1A-9b lands and Founder activation).

---

## Later Founder / Vercel actions (required for real generation)

Do **not** treat the code merge as activation.

1. **Enable / configure Vercel AI Gateway** for the DivLab Vercel project (if not already enabled).
2. **Ensure billing / credits** are available on the Vercel team with a **conservative spend budget and rate limit** before any non-local use.
3. **Prefer Vercel OIDC** on Preview/Production so requests authenticate without storing an OpenAI (or other vendor) API key in DivLab env. Gateway routes the model.
4. **Optional local/dev fallback:** `AI_GATEWAY_API_KEY` (AI Gateway key — not a direct OpenAI key). Direct vendor keys are **not** the primary architecture; use BYOK in the Gateway dashboard only if Founder chooses that path later.
5. **Run the live benchmark** only with explicit opt-in (see below), review the deterministic scorecard, and **approve a winning model**.
6. **Server-only env selector** (after approval + 1A-9b integration ticket):
   - `DIVBRAIN_PROVIDER=ai-gateway`
   - `DIVBRAIN_PROVIDER_MODEL=<approved creator/model id>`
   - Optional: `DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS` (bounded; default 1024; hard cap 2048)
7. **Wire factory into the application service** in a dedicated follow-up (not this PR). Until then, production behavior stays `provider_unavailable`.

### Live benchmark command (Founder laptop / secured env only)

```bash
DIVBRAIN_PROVIDER_BENCHMARK_LIVE=1 \
AI_GATEWAY_API_KEY=*** \
npx tsx scripts/divbrain-provider-benchmark.mts
```

Hard caps: **3 cases × 3 candidates**, **256 max output tokens**, 30s timeout.  
Reports contain **no** prompts, policy text, or raw provider payloads.

---

## Explicit non-goals of this foundation PR

- No production UI / AppShell changes
- No edits under `app/brain/**`, `components/brain/**`, or `lib/divbrain/server/ui/**`
- No paid live benchmark during the Cursor task
- No mutation of Vercel project env vars from this repository change
- No automatic merge (`manual-only` risk)

---

## Security reminders

- Server-only provider/gateway modules; never import from client components
- Never commit secrets; never log API keys or raw provider error bodies
- Model ids are server-configured only — never browser-selectable
- Preserve Alpha allowlist, RLS, and blocked-prompt non-persistence behavior
