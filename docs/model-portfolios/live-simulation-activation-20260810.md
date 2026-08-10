# Modellportföljer — live simulation activation 2026-08-10

This records the live-simulation settlement activation for issue #147.

Enabled by this change:

- service-role-only atomic settlement RPC for proposed buy/sell decisions;
- simulated courtage of exactly SEK 10.00 on every executed BUY;
- FX audit fields and server-only Frankfurter/ECB adapter (fail-closed);
- dividend event registration/credit foundation (ingestion remains fail-closed until a verified corporate-action provider is wired);
- market LIVE badge with 2026 XSTO/US holiday calendars;
- portfolio status activated from `draft` to `active` once the execution path exists.

Deliberately fail-closed:

- automated dividend/corporate-action ingestion is not enabled;
- decisions with `execution_allowed_at_decision_time=false` never settle;
- missing/invalid FX for foreign securities rejects settlement rather than assuming 1.0.
