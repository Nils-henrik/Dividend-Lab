# 00_DIVLAB_MASTER_UPDATE_2026-08-15_PEER_RUNTIME_REPORT_AWARE_VERIFICATION

Detta är ett senare Master Update-lager för **real-company peer runtime verification** till:

- `00_DIVLAB_MASTER_2026-08-12-updated.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_PEER_VALIDATION.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_INTEGRATION_PHASE2.md`
- senare historik-Master Updates

Den tidigare verifierade 5/9-körningen ska fortsatt betraktas som en historisk baseline och får inte skrivas om. Denna fil beskriver en **ny senare protected Preview-körning** på nyare branch-head.

Ingen historisk portföljdata, analys eller affär ändras av denna uppdatering.

---

## 1. Releaseklassning

Deep Research / peer comparison kvarstår som:

**ACTIVE_PR / INTERNAL_VALIDATION — inte production**

Branch:

`agent/divlab-deep-research-v1`

Draft PR:

`#231`

Ingen merge, production release eller publik `/analyses`-navigation genomförs av denna verifiering.

---

## 2. Protected Preview-verifiering

Verifierad Preview-head:

`f6d5cb075d6f060d05222f8ec2147ffdece51d65`

Protected Vercel deployment:

`dpl_AyQqLwHrKCEWrQWjuqrcM2kzvBiD`

Batch request:

`/api/internal/analysis/peer-research?batch=1`

Verifierad runtime-tid:

`2026-08-15T17:32:56Z`

Resultat:

**5/9 peer-ready. 0 writes. 0 target-AI calls.**

Batchen var dry-run-only och `persist=false`.

---

## 3. Senaste exakta peer-status

### Ready

- `MTRS.ST` — Munters Group
- `SAND.ST` — Sandvik
- `EPI-A.ST` — Epiroc A
- `PDX.ST` — Paradox Interactive
- `MTG-B.ST` — Modern Times Group MTG B

### Inte ready

- `HACK.ST` — endast `multiYearFundamentalCoverage` blockerar
- `KAMBI.ST` — `freshPrimarySource` + `primaryEvidenceCoverage` blockerar
- `GIG-SDB.ST` — `multiYearFundamentalCoverage` + `freshPrimarySource` + `primaryEvidenceCoverage` + `peerMetricCoverage`
- `SF.ST` — `freshPrimarySource` + `primaryEvidenceCoverage` blockerar i denna körning

Totalen är fortsatt 5/9, men sammansättningen har ändrats jämfört med den tidigare verifierade baselinen: **MTG är nu ready medan Stillfront inte var ready i denna senare körning.**

Detta ska dokumenteras som en ny observation, inte användas för att skriva om det äldre resultatet.

---

## 4. MTG report-aware fix är nu runtime-verifierad

MTG:s dedikerade report-aware discovery hittade och hämtade riktig aktuell primärrapport.

Verifierad primärkälla i batchen:

- source id: `nordic-primary:MTG-B:2026-07-21T07:30:00.000Z:0`
- publisher: Nasdaq Nordic attachment host
- `primary=true`
- `documentRetrieved=true`
- title: `MTG delivers strong Q2 with 6% pro forma growth and 24% adjusted EBITDA margin`
- report date: `2026-07-21`

MTG klarade samtliga `peer-research-readiness-v1` checks och hade eligible metrics:

- P/E
- P/FCF
- EV/EBITDA

Permanent slutsats:

**Report-aware CNS discovery är runtime-verifierad för MTG utan utökad request-budget eller sänkt quality gate.**

---

## 5. Kambi är fortfarande en riktig primary-discovery blocker

Kambi klarade i senaste batchen:

- company classification
- fundamental methodology
- fundamental coverage
- multi-year fundamental coverage
- source traceability
- valuation traceability
- valuation provenance version
- peer metric coverage

Men misslyckades med:

- `freshPrimarySource=false`
- `primaryEvidenceCoverage=false`

Runtime diagnostics:

- Nordic primary source count: `0`
- Nordic primary evidence count: `0`

Detta innebär att nästa Kambi-arbete ska fokusera på **issuer/query matching och bounded Nasdaq report discovery**, inte på valuation eller flerårs-fundamenta.

Quality gate får inte sänkas för att göra Kambi ready.

---

## 6. Stillfront ska behandlas som reproducerbarhetsfråga

Stillfront var ready i den tidigare verifierade 5/9-körningen men fick i denna senare batch:

- `freshPrimarySource=false`
- `primaryEvidenceCoverage=false`
- source count `0`
- evidence count `0`

Detta ska inte omedelbart tolkas som en permanent metodförsämring eller som att tidigare resultat var fel.

Nästa steg är en isolerad rerun och inspektion av query/issuer matching, eftersom skillnaden kan bero på bounded search-resultat/ranking eller aliasmönster.

Ingen automatisk peer-substitution är tillåten.

---

## 7. Atlas Copco-setet förblir första kompletta real-data-setet

Atlas Copco A:s peer-set:

- Munters
- Sandvik
- Epiroc A

är fortsatt:

**3/3 peer research-ready**

Alla tre klarade den nya protected Preview-batchen igen.

Detta stärker reproducerbarheten för Atlas-setets readiness.

Det finns fortfarande ingen riktig persisted Atlas peer-audit eftersom immutable peer researchversioner ännu inte har skrivits till DEV.

---

## 8. Embracer-setet har förbättrats men är inte komplett

Senaste körning:

- Paradox: ready
- MTG B: ready
- Stillfront: not ready i denna batch

Därmed är Embracer-setet **2/3** i senaste körningen.

Ingen peer-audit får skapas innan hela registrerade setet kan bindas till giltiga immutable peer researchversioner vid samma point-in-time-boundary.

---

## 9. Evolution-setet förblir blockerat

Senaste körning:

- Hacksaw: not ready — flerårshistorik
- Kambi: not ready — primary discovery
- GiG Software: not ready — flerårshistorik + primary discovery + peer metric coverage

Evolution-setet är därför fortsatt **0/3 komplett för audit**.

Ingen automatisk ersättnings-peer får väljas av AI.

---

## 10. DEV persistence-status oförändrad

Protected dry-run-access fungerar nu genom den autentiserade Vercel-fetchvägen utan att Deployment Protection sänks.

Persistence kräver fortfarande de dedikerade Preview-secrets:

- `DIVLAB_ANALYSIS_DEV_SUPABASE_URL`
- `DIVLAB_ANALYSIS_DEV_SUPABASE_SERVICE_ROLE_KEY`

Ingen fallback till generic/public/production-konfiguration är tillåten.

Utan dessa credentials ska `persist=1` fortsatt fail-closed med `dev_admin_unavailable`.

---

## 11. Verifierad Quality Gate

Head `f6d5cb075d6f060d05222f8ec2147ffdece51d65` har efter denna checkpoint passerat full repository Quality Gate:

- lint
- TypeScript
- core tests
- SEO/news tests
- DivBrain tests
- Cursor bridge tests
- Next.js production build

"Production build" betyder CI-build, inte production deployment.

---

## 12. Nästa prioriterade arbetsordning

1. isolera Kambi protected Preview dry-run och felsök issuer/query matching
2. isolera Stillfront rerun för att avgöra om 0 primary hits är reproducerbart
3. korrigera endast bounded discovery/matching om felet kan bevisas
4. repeat nine-peer dry-run efter eventuell kodfix
5. behåll Atlas-setet som första persistence-kandidat
6. bind dedikerade DEV credentials säkert utan repo-secret
7. persistiera MTRS, SAND och EPI-A endast om samma körning är peer-ready
8. SQL-verifiera immutable peer versions
9. skapa första riktiga Atlas Copco version-bound peer audit
10. kör första riktiga single-call `analyst-v3-peer`
11. kvalitativ QA innan peer-data får påverka core thesis/scenarier

---

## 13. Operativ kortregel

**Senaste batchen = 5/9, men MTG ready ersätter inte Stillfronts nya blocker i historiken.**

**Atlas = fortsatt 3/3 stabilt ready.**

**Kambi = primary-discovery problem tills motsatsen bevisas.**

**Stillfront = isolera reproducerbarhet innan kod ändras.**

Om source discovery eller point-in-time-evidence inte kan verifieras:

**STOP / UNKNOWN — aldrig sänkt quality gate eller automatisk peer-substitution.**
