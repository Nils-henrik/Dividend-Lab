# DivBrain provider setup (Phase 1B)

**Status:** Provider foundation + runtime selection wiring implemented — **no production AI activation**  
**Audience:** Founder (Henrik) + engineers  
**Related:** Ticket 1B-1 / 1B-2

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
| **Benchmark candidates** | Three families verified against the public AI Gateway catalog at implementation time (see below) |
| **Benchmark harness** | Deterministic local rubric + multi-candidate runner (`lib/divbrain/server/benchmark/**`) |
| **Live safety gate** | `scripts/divbrain-provider-benchmark.mts` requires `DIVBRAIN_PROVIDER_BENCHMARK_LIVE=1` + gateway auth presence; hard-caps cases/tokens; **not** part of `npm test`, Quality Gate, build, or deploy |
| **Tests** | Focused mocked adapter/factory/benchmark tests plus runtime provider-selection tests. Normal CI never invokes model generation |
| **Dependencies** | `ai@7`, direct `@ai-sdk/gateway@4.0.44`, and `zod` |

### Resolved candidate set (verified during 1B-1)

All three intended IDs were present in the AI Gateway catalog at implementation time:

| Family | Model id | Role |
|--------|----------|------|
| OpenAI | `openai/gpt-5.6-luna` | First intended / cost-efficient primary candidate |
| Anthropic | `anthropic/claude-sonnet-5` | Sonnet benchmark candidate |
| Google | `google/gemini-3.6-flash` | Flash benchmark candidate |

Architecture remains **provider-neutral** behind `DivBrainProvider`. OpenAI is first among equals for benchmarking — not a vendor lock-in.

### Runtime default and activation boundary

`UnconfiguredProvider` remains the runtime default.

The Alpha application service now calls the provider factory when no explicit server-side provider is supplied. This is **selection wiring only**: constructing the provider does not make a model request. A network generation call can occur only after the normal DivBrain lifecycle reaches the provider step (authentication → Alpha gate → validation → guardrails → ownership/history → user-message persistence → context assembly → provider request mapping).

Missing, unknown, incomplete, or malformed provider configuration resolves to `UnconfiguredProvider` and preserves the existing honest `provider_unavailable` behavior.

**Do not set the activation environment variables in Preview or Production until the Founder has approved the model and a spend limit.** Once valid activation variables are set, allowlisted Alpha users can incur real provider usage when sending allowed messages.

---

## Later Founder / Vercel actions required for real generation

Do **not** treat the code merge as activation.

1. **Enable / configure Vercel AI Gateway** for the DivLab Vercel project if needed.
2. **Set a conservative spend budget and rate limit before activation.** DivLab is currently treated as a cost-sensitive project; no uncapped provider usage should be enabled.
3. **Prefer Vercel OIDC** on Preview/Production so requests authenticate without storing a direct OpenAI (or other vendor) API key in DivLab env. Gateway routes the model.
4. **Optional local/dev fallback:** `AI_GATEWAY_API_KEY` (AI Gateway key — not a direct OpenAI key). Direct vendor keys are not the primary architecture; use Gateway BYOK only if deliberately chosen later.
5. **Run the live benchmark only with explicit approval**, review quality/latency/estimated-cost results, and choose the production candidate.
6. **Only after approval**, set the server-only runtime selector:
   - `DIVBRAIN_PROVIDER=ai-gateway`
   - `DIVBRAIN_PROVIDER_MODEL=<approved creator/model id>`
   - Optional: `DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS` (bounded; default 1024; hard cap 2048)
7. Verify one allowlisted Internal Alpha conversation end-to-end, inspect usage/cost, then decide whether to keep the provider enabled.

Until step 6 is deliberately completed, production remains on `UnconfiguredProvider`.

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
- Do not add production provider env vars merely to test wiring.
- Start with a small Gateway budget/rate limit and increase only after measured use.
- Keep output-token limits bounded and prefer the lowest-cost model that meets the agreed quality bar.
- Do not enable uncapped fallbacks that can silently move traffic to a more expensive model.

---

## Security reminders

- Server-only provider/gateway modules; never import them from client components.
- Never commit secrets; never log API keys or raw provider error bodies.
- Model ids are server-configured only — never browser-selectable.
- Preserve Alpha allowlist, RLS, owner-scoped repository semantics, and blocked-prompt non-persistence.
- `UnconfiguredProvider` is the fail-closed state for invalid or absent provider configuration.
