# DivBrain provider setup (Phase 1B + Issue #103 Cost Guard)

**Status:** Provider foundation + runtime selection + Cost Guard / usage ledger implemented — **no production AI activation**  
**Audience:** Founder (Henrik) + engineers  
**Related:** Ticket 1B-1 / 1B-2 / 1B-4 / 1D-2 / 1D-3 / Issue #103

This document separates what is **already implemented in code** from the **later Founder / Vercel actions** required before real generation is enabled.

---

## Already handled in code

| Area | What exists |
|------|-------------|
| **AI Gateway adapter** | Server-only `AiGatewayProvider` implementing the existing `DivBrainProvider` contract (`lib/divbrain/server/providers/ai-gateway-provider.ts`) |
| **Request mapping** | Ordered context blocks → system prompt; conversation messages → AI SDK messages — never leaked back to the browser |
| **Error normalization** | Timeout/abort → `cancelled`; 429 → `rate_limited`; auth/config → `provider_unavailable`; 5xx/outage → `provider_unavailable`; malformed/empty output → `failed` + catalog error. Raw gateway bodies are never surfaced |
| **Provider factory** | `createDivBrainProvider()` — **defaults to `UnconfiguredProvider`** unless server config explicitly selects `ai-gateway` with a valid model id |
| **Runtime selection wiring** | Alpha `/brain` application-service wiring now resolves its default provider through the provider factory. Explicit test/server provider overrides still win. Missing or malformed config remains fail-closed |
| **Cost Guard** | Server-only pre-flight budget enforcement **before** `provider.generate()` for AI Gateway. Missing/malformed/inconsistent config, unpriceable models, or daily/monthly/request caps fail closed with zero network generation |
| **Usage ledger** | `public.divbrain_usage_events` migration + server repository/aggregates (integer micro-USD). RLS enabled; no anon/authenticated access; service_role SELECT/INSERT only |
| **Benchmark candidates** | Three families verified against the public AI Gateway catalog at implementation time (see below) |
| **Benchmark harness** | Deterministic local rubric + multi-candidate runner (`lib/divbrain/server/benchmark/**`) |
| **Live safety gate** | `scripts/divbrain-provider-benchmark.mts` requires `DIVBRAIN_PROVIDER_BENCHMARK_LIVE=1` + gateway auth presence; hard-caps cases/tokens; **not** part of `npm test`, Quality Gate, build, or deploy |
| **Tests** | Focused mocked adapter/factory/benchmark/Cost Guard tests plus runtime provider-selection tests. Normal CI never invokes model generation |
| **Dependencies** | `ai@7`, direct `@ai-sdk/gateway@4.0.44`, and `zod` |

### Resolved candidate set (verified during 1B-1; pricing re-verified 2026-08-08)

All three intended IDs were present in the AI Gateway catalog at implementation time:

| Family | Model id | Role | Conservative safety price (USD / token) |
|--------|----------|------|------------------------------------------|
| OpenAI | `openai/gpt-5.6-luna` | First intended / cost-efficient primary candidate | input `0.00000022`, output `0.00000132` (regional US list; higher than base) |
| Anthropic | `anthropic/claude-sonnet-5` | Sonnet benchmark candidate | input `0.0000022`, output `0.000011` (regional list; do not assume cheapest route) |
| Google | `google/gemini-3.6-flash` | Flash benchmark candidate | input `0.0000015`, output `0.0000075` (base/list; priority tier is opt-in) |

Source: `https://ai-gateway.vercel.sh/v1/models` on **2026-08-08**. Safety calculations must not choose a cheaper provider-specific price when Gateway routing could incur a higher listed price. If current pricing cannot be resolved confidently for a configured model, Cost Guard fails closed.

Architecture remains **provider-neutral** behind `DivBrainProvider`. OpenAI is first among equals for benchmarking — not a vendor lock-in.

### Runtime default and activation boundary

`UnconfiguredProvider` remains the runtime default.

The Alpha application service now calls the provider factory when no explicit server-side provider is supplied. This is **selection wiring only**: constructing the provider does not make a model request. A network generation call can occur only after the normal DivBrain lifecycle reaches the provider step **and** Cost Guard pre-flight allows it (authentication → Alpha gate → validation → guardrails → ownership/history → user-message persistence → context assembly → provider request mapping → **Cost Guard** → provider).

Missing, unknown, incomplete, or malformed provider configuration resolves to `UnconfiguredProvider` and preserves the existing honest `provider_unavailable` behavior.

**Activation is explicitly blocked until all of the following are true:**

1. Cost Guard server config is set and valid (see below)
2. A dedicated DivBrain production AI Gateway key with a hard spend quota is configured (external second-layer hard stop)
3. The live benchmark has been run with explicit approval and reviewed
4. Founder approves the selected model

**Do not set the activation environment variables in Preview or Production until the Founder has approved the model and spend limits.** Once valid activation variables are set, allowlisted Alpha users can incur real provider usage when sending allowed messages — still subject to Cost Guard.

---

## Founder Alpha cost policy (SEK) ↔ runtime USD thresholds

Agreed Internal Alpha policy (no automatic refill, no automatic budget increase, no uncapped expensive-model fallback):

| Level | SEK / month | Runtime role |
|-------|-------------|--------------|
| Normal / target | **~200 SEK** | Observability / review target |
| Warning / review | **300 SEK** | Warning/review level |
| Hard stop | **400 SEK** | Enforced monthly hard limit |

AI Gateway bills/quotes in **USD**. Runtime enforcement uses **server-only integer micro-USD** thresholds (`1 USD = 1_000_000` micro-USD).

**Do not hard-code a fake/static SEK↔USD exchange rate into business logic.** Before activation, convert the Founder SEK policy to USD micro-unit thresholds using a **conservative contemporaneous FX conversion**, then set the env vars below. Document the FX source/date used for that activation mapping in the activation note.

Also set:

- a per-request projected-cost ceiling
- a UTC-day hard limit
- monthly target / warning / hard limit (target ≤ warning ≤ hard; request ≤ day ≤ month hard)

---

## Later Founder / Vercel actions required for real generation

Do **not** treat the code merge as activation.

1. **Enable / configure Vercel AI Gateway** for the DivLab Vercel project if needed.
2. **Create a dedicated DivBrain production Gateway API key** with an explicit **hard spend quota** as an external second-layer hard stop. Do not share keys with unrelated workloads. This task must not create/change that key.
3. **Set Cost Guard server-only env vars** (required before any paid generate):
   - `DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD`
   - `DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD`
   - `DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD`
   - `DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD`
   - `DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD`
4. **Apply the usage-ledger migration** (`supabase/migrations/20260808143000_create_divbrain_usage_events.sql`) via the normal env progression after Founder review — not from the Cursor task.
5. **Prefer Vercel OIDC** on Preview/Production so requests authenticate without storing a direct OpenAI (or other vendor) API key in DivLab env. Gateway routes the model.
6. **Optional local/dev fallback:** `AI_GATEWAY_API_KEY` (AI Gateway key — not a direct OpenAI key). Direct vendor keys are not the primary architecture; use Gateway BYOK only if deliberately chosen later.
7. **Run the live benchmark only with explicit approval**, review quality/latency/estimated-cost results, and choose the production candidate.
8. **Only after approval**, set the server-only runtime selector:
   - `DIVBRAIN_PROVIDER=ai-gateway`
   - `DIVBRAIN_PROVIDER_MODEL=<approved creator/model id>`
   - Optional: `DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS` (bounded; default 1024; hard cap 2048)
9. Verify one allowlisted Internal Alpha conversation end-to-end, inspect usage/cost ledger rows, then decide whether to keep the provider enabled.

Until step 8 is deliberately completed **with** Cost Guard + Gateway spend quota in place, production remains on `UnconfiguredProvider`.

### Live benchmark command (secured environment only)

```bash
DIVBRAIN_PROVIDER_BENCHMARK_LIVE=1 \
AI_GATEWAY_API_KEY=*** \
npx tsx scripts/divbrain-provider-benchmark.mts
```

Hard caps: **3 cases × 3 candidates**, **256 max output tokens**, 30s timeout.  
Reports contain **no** prompts, policy text, or raw provider payloads.

---

## Cost-control rules

- Normal tests/builds must never invoke paid model generation.
- Provider activation is server-only and explicit; no browser-selectable model ids.
- Cost Guard pre-flight runs **before** `provider.generate()` and enforces per-request, daily, and monthly hard limits using a conservative projection (bounded current input + configured max output tokens).
- Budget rejections return the calm catalog `rate_limited` path; ordinary users must not see raw spend values or internal thresholds.
- Blocked safety prompts produce zero provider calls and zero usage-ledger rows.
- After a paid call, persist normalized usage + cost (validated Gateway actual when available; otherwise conservative catalog estimate; never silent zero for a paid call).
- Do not add production provider env vars merely to test wiring.
- Start with a small Gateway spend quota/rate limit and increase only after measured use.
- Keep output-token limits bounded (hard cap **2048**) and prefer the lowest-cost model that meets the agreed quality bar.
- Do not enable uncapped fallbacks that can silently move traffic to a more expensive model.
- No automatic refill and no automatic budget increase.

---

## Security reminders

- Server-only provider/gateway/Cost Guard modules; never import them from client components.
- Never commit secrets; never log API keys or raw provider error bodies.
- Model ids are server-configured only — never browser-selectable.
- Preserve Alpha allowlist, RLS, owner-scoped repository semantics, and blocked-prompt non-persistence.
- Usage ledger stores no prompts, completions, policy text, source excerpts, secrets, raw provider payloads, or raw errors.
- `UnconfiguredProvider` is the fail-closed state for invalid or absent provider configuration.
- Real AI Gateway execution additionally fails closed without valid Cost Guard configuration and ledger access.
