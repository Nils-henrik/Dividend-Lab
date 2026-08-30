# DivLab Master Update — GitHub Peer Research Export Runner v1

**Datum:** 2026-08-15  
**Status:** RETIRED efter real provider-validering  
**Scope:** historik över avvisad Actions-transport; får inte återaktiveras utan verifierad providerförändring

## Slutsats

GitHub Actions-runnern var säkerhetsmässigt korrekt och passerade full Quality Gate #816, men är empiriskt olämplig som Yahoo quoteSummary/crumb-fetchmiljö.

Tre riktiga hosted-runner-försök gav:

- `westus2` → `MTRS.ST financial_statements_unavailable`
- `eastus` → `MTRS.ST financial_statements_unavailable`
- `westus` med explicit session-preflight → `peer_research_export_yahoo_session_unavailable`

Artifact-upload skippades korrekt vid varje failure och inga DB-, AI- eller deploy-credentials fanns i workflowen.

## Cleanup

Följande Actions-specifika operatörsfiler tas bort:

- `.github/workflows/peer-research-export.yml`
- `ops/peer-research-export-request.json`
- `scripts/divlab-peer-research-export.mts`
- `lib/analysis/peer-research-export-request.ts`
- dess request-/workflow-kontraktstester

Den gemensamma server-only 3/3-exportmotorn behålls men görs request-/transport-agnostisk. Den används i stället av den befintliga Preview-only Functions-routen, där Yahoo-runtime redan har verifierats fungera.

## Permanent lärdom

- säker transport får inte styra vilken provider-exekveringsmiljö som används,
- GitHub Actions/build får inte retryas eller förses med gissade Yahoo-varianter för samma blocker,
- facts-only research måste köras där befintliga provider-kontrakt fungerar,
- operatortransport ska vara read-only, checksum-bound och separerad från DEV-persistens.

## Scope

- ingen production DB-write,
- ingen production deploy,
- ingen merge,
- ingen historisk omskrivning,
- ingen ny credential.
