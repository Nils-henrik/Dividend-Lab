# DivBrain domain package

Shared DivBrain domain language for server and client.

## Boundaries

- **Shared (this folder today):** `constants`, `types`, `errors`, `results`, `validation`, `sources`, `citations` — safe to import from server or client.
- **Server-only (later tickets):** identity, policy, context assembly, provider adapters, repositories, services, allowlists, Learning retrieval. Those modules must use `import "server-only"` and must never be imported by browser-safe UI.
- Browser-safe modules must never import server-only DivBrain code.
- Never expose secrets, tokens, emails, raw provider/DB errors, stack traces, or hidden reasoning across the browser boundary.

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
