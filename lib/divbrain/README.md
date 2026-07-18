# DivBrain domain package

Shared DivBrain domain language for server and client.

## Boundaries

- **Shared (this folder today):** `constants`, `types`, `errors`, `results`, `validation`, `sources`, `citations`, `guardrails` — safe to import from server or client.
- **Server-only by convention:** `server/guardrails`, `server/guardrail-evals` — detection logic and eval fixtures. These modules live under `lib/divbrain/server/` and **must never be imported by client components** or other browser-safe UI. Package-level `import "server-only"` is deferred until an approved dependency/foundation ticket; folder placement and this README are the current boundary.
- Later tickets add identity, policy/context assembly, provider adapters, repositories, services, allowlists, Learning retrieval under the same server-only rule.
- Browser-safe modules must never import server-only DivBrain code.
- Never expose secrets, tokens, emails, raw provider/DB errors, stack traces, or hidden reasoning across the browser boundary.

## Guardrails (Ticket 1A-3a)

- `guardrails.ts` — canonical decisions, reason codes, enforceable constraints, public-message catalog, assessment builders.
- `server/guardrails.ts` — deterministic normalization + multi-finding evaluation + `evaluateDivBrainGuardrails`.
- `server/guardrail-evals.ts` — 28 Swedish seed fixtures, pure deterministic runner, safe reports (no raw prompts).

### Canonical decisions

Exactly:

- `allow` — general educational/informational answer may proceed
- `allow_with_constraints` — answer only while applying all returned constraints
- `block` — do not comply with the requested action; a safe educational alternative may still be offered in copy

Severity: `block` > `allow_with_constraints` > `allow`.

### Reason codes and constraints

- Several reason codes may coexist; duplicates are removed; order follows `DIVBRAIN_GUARDRAIL_REASON_CODES`.
- Constraints are machine-readable response behaviors (not disclaimer labels); order follows `DIVBRAIN_GUARDRAIL_CONSTRAINTS`.
- Ordinary allowed education normally returns empty `reasonCodes` and `constraints`.
- Invalid/malformed input is a technical `invalid_request`, not a policy reason.

### Assessment shape

```ts
{
  decision,
  reasonCodes,
  constraints,
  policyVersion,
  publicMessageKey,
  publicMessage // catalog-backed Swedish only
}
```

Assessments never include raw prompts, matched text, regexes, rule ids, secrets, or user identifiers. Public messages come only from `DIVBRAIN_GUARDRAIL_PUBLIC_MESSAGES_SV`, selected by fixed reason priority (never concatenated).

### Policy block vs technical error

- **Technical invalid input** → `DivBrainResult` failure with `invalid_request`.
- **Policy outcome** → successful assessment (`decision: "block"` is not a thrown error).
- Later service layers map blocks to `safety_blocked` for the UI.

### Determinism and limitations

- Findings are aggregated from named predicates; first-match-wins single-reason models are not used.
- This is an initial deterministic filter — **not** complete semantic safety. Provider-side policy and later eval expansion remain required.

### Seed evals

Fixtures and the pure runner live in `server/guardrail-evals.ts` (`DIVBRAIN_GUARDRAIL_EVAL_CASES`, `runDivBrainGuardrailEvals`). The runner asserts decision, reasonCodes, constraints, policyVersion, and `publicMessageKey`. Executable CI tests are deferred until an approved test-foundation ticket.

1A-3b should grow the fixture list without changing assessment/report contracts.

## Sources and citations

- `sources.ts` — categories, verification/freshness, source validation, URL/route policy, serialization, deduplication.
- `citations.ts` — numbered citation references, citation validation/serialization, grounded-answer shape.
- Generated interpretation is never a source category.
- External `canonicalUrl` and `internalRoute` are separate fields.
- `recordRef` is an opaque document/record identifier only — not a URL, credential, or provider blob.
- Syntactically valid URLs are not inherently trusted; no domain allowlist in this layer.
- Deduplication uses id → canonical URL → internal route; titles alone never merge sources.
- Exact same-ID duplicates with compatible material are dropped.
- Compatible different-ID duplicates (same URL or internal route) keep the first source/ID and alias later IDs → retained ID (`sourceIdAliases`).
- Contradictory material on any identity match fails validation.
- Citation builders: one entry per source, or multiple appearances sharing one number per `sourceId`.
- Citation validation requires contiguous numbers `1..N` and a stable one-number-per-sourceId mapping.
- `retrievedAt` requires a full UTC instant (`...Z`); `publishedAt` / `dataAsOf` allow calendar date or UTC instant.
- `retrievedAt` is attachment/retrieval metadata only — not source identity, provenance, verification, freshness, publication time, or data-as-of. Compatible duplicates keep the first-seen `retrievedAt`.
- Grounded answers remap citation IDs through aliases, preserve citation numbers, and fail on numbering conflicts after alias resolution.
- Orphan citations and unused final sources are rejected.
- Final grounded-answer payloads contain only retained cited sources (aliases are not retained in the payload).
- Unknown extra fields on parse/validate input are ignored and not retained in output.

## Plain text and rendering

- Source/citation text validation rejects tag-shaped HTML/XML markup, not bare comparison operators such as `P/E < 15`.
- Validated plain text is **not** safe for `dangerouslySetInnerHTML`.
- Render with normal React text escaping at UI time.

## System messages

`system` is a valid internal role for server-controlled messages only. Browser input must never supply system-policy text, and policy text must not be exposed to clients merely because the shared role union includes `system`.

## Ownership privacy

`access_denied` and `not_found` both exist in the taxonomy. Future owner-scoped conversation/message reads should normally map missing and cross-owner resources to the same safe `not_found` response so ownership is not leaked.
