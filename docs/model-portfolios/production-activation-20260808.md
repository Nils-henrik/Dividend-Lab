# Modellportföljer — production activation 2026-08-08

This docs-only commit intentionally records the production activation point after the reviewed and merged model-portfolio foundation work.

Included on `main` before this activation trigger:

- secure model-portfolio schema and four seeded portfolios;
- 10,000 SEK initial model cash per portfolio;
- authenticated `/portfolios` overview and follow/unfollow foundation;
- 5,000 SEK idempotent monthly contribution automation on the 25th;
- Supabase Cron contribution job;
- four deterministic Stockholm evaluation windows;
- fail-closed EODHD configuration;
- idempotent scheduled-run API gate;
- deterministic quote freshness, FX, cash and concentration risk gates.

The portfolio execution engine remains intentionally disabled until a verified market-data API key is configured and the post-model transaction validator is implemented. No seeded or synthetic trades are permitted.
