# Modellportföljer — live simulation activation 2026-08-10

This records the live-simulation settlement activation for issue #147 / hotfix #151.

Enabled by this change:

- service-role-only atomic settlement RPC for proposed buy/sell decisions;
- simulated courtage of exactly SEK 10.00 on every executed BUY and SELL;
- FX audit fields and server-only Frankfurter/ECB adapter (fail-closed);
- dividend event registration/credit foundation (ingestion remains fail-closed until a verified corporate-action provider is wired);
- market LIVE badge with 2026 XSTO/US holiday calendars;
- portfolio status activated from `draft` to `active` once the execution path exists;
- `MODEL_PORTFOLIO_EXECUTION_ENABLED=true` so fresh decisions stamp `execution_allowed_at_decision_time=true` and settle in the same run;
- rejected settlements flip the decision to `rejected`/`failed` (never leave ambiguous forever-proposed rows);
- follower trade payload is attached to executed run results for transparency publication;
- explicit AI usage observability per portfolio + four-portfolio batch aggregate from the actual model/API response (not Vercel Agent Runs).

Deliberately fail-closed:

- automated dividend/corporate-action ingestion is not enabled;
- decisions with `execution_allowed_at_decision_time=false` never settle;
- missing/invalid FX for foreign securities rejects settlement rather than assuming 1.0;
- old dry-run proposals remain unsettleable by design (issue #147/#151).
