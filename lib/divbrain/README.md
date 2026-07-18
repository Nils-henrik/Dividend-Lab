# DivBrain domain package

Shared DivBrain domain language for server and client.

## Boundaries

- **Shared (this folder today):** `constants`, `types`, `errors`, `results`, `validation` — safe to import from server or client.
- **Server-only (later tickets):** identity, policy, context assembly, provider adapters, repositories, services, allowlists. Those modules must use `import "server-only"` and must never be imported by browser-safe UI.
- Browser-safe modules must never import server-only DivBrain code.
- Never expose secrets, tokens, emails, raw provider/DB errors, stack traces, or hidden reasoning across the browser boundary.

## System messages

`system` is a valid internal role for server-controlled messages only. Browser input must never supply system-policy text, and policy text must not be exposed to clients merely because the shared role union includes `system`.

## Ownership privacy

`access_denied` and `not_found` both exist in the taxonomy. Future owner-scoped conversation/message reads should normally map missing and cross-owner resources to the same safe `not_found` response so ownership is not leaked.
