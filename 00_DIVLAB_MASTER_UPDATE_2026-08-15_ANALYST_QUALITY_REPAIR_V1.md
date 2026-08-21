# DivLab Master Update — Analyst Quality Repair v1

Date: 2026-08-15
Status: Preview release candidate / fail-closed

## Runtime finding

The second real Atlas Copco A Preview run passed structured Analyst generation far enough to reach the deterministic Analyst quality gate, but returned `analyst_quality_gate_failed`. The DEV database remained clean with 0 rows in `divlab_analyses`, `divlab_analysis_versions`, `divlab_analysis_contents` and `divlab_analysis_sources`, confirming atomic fail-closed behavior.

The existing generation resilience repaired transport/domain failures, but there was no bounded repair step for blockers discovered only after DivLab rebuilt deterministic Bear/Base/Bull valuation and evaluated `analyst-quality-v1`.

## Analyst Quality Repair v1

A single post-valuation repair is now allowed when and only when the first `analyst-quality-v1` result is not publishable.

- Repair model: escalation model (`openai/gpt-5.6-terra`).
- Maximum quality-repair attempts: exactly 1.
- The repair receives the concrete failed checks/blockers, current draft, deterministic scenario result, valuation provenance, source registry and bounded evidence.
- The repair must regenerate the complete `analyst-v2` object.
- The same `divLabAnalystDraftSchema` and `validateAnalystDraftAgainstPacket(...)` contracts apply.
- Unknown qualitative factors may never be promoted merely to satisfy the score; evidence must legitimately support them.
- Source IDs may never be invented.
- Bear/Base/Bull must still resolve deterministically to Bear < Base < Bull.
- Confidence remains calibrated to unknown qualitative factors.
- DivLab view remains bound to deterministic Base upside/downside.
- No quality threshold is lowered or bypassed.

After the bounded repair, DivLab rebuilds the research packet and re-runs the exact unchanged `analyst-quality-v1` gate. A second failure remains `analyst_quality_gate_failed` and nothing is persisted or published.

## Preview observability

The Preview operator now returns and renders on quality failure:

- Research quality score
- Analyst quality score
- AI view
- Risk / confidence
- Exact blockers
- Failed check names
- Warnings

Runtime logs expose only safe gate metadata (score, blocker count, failed check names and safe failure codes), never raw research, secrets or complete model output.

## Release gate remains unchanged

Production must not merge until a real curated Preview run reaches:

1. Research quality 100/100
2. Analyst quality 100/100
3. guarded atomic publication success in `dividend-lab-dev`
4. manual QA of the public analysis page, chart, sources, scenarios, X/OG card, canonical/robots/JSON-LD/sitemap
5. Founder/ChatGPT release review

No production database writes, portfolio trades or historical experiment rewrites are introduced by this repair path.
