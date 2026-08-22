# DIVLAB MASTER UPDATE — Analysis Canary Certification v1

Datum: 2026-08-22
Status: ACTIVE / SUPERSEDES_FULL_MONSTER_RERUN_AS_RELEASE_GATE
Branch: `agent/analysis-monster-patches-v1`

## Beslut

Den frysta 27-måls monsterkörningen behålls som historiskt discovery-/stresstest. Den ska inte återköras som normal release-gate och ska inte användas för att föranalysera marknaden åt framtida betalande användare.

Produktionsprincipen är i stället att DivLab certifierar analysmotorn med ett litet antal representativa canary-fall och därefter kör riktig research först när användaren begär analys av ett konkret bolag.

## Certifieringssvit

Följande metodikfamiljer ska representeras:

1. nordisk operating company — Volvo;
2. US operating company — Microsoft;
3. bank — SEB;
4. investment company — Investor;
5. asset manager — EQT.

Därtill ska deterministiska tester fortsatt verifiera att unsupported families, exempelvis insurance/real-estate/ETF, failar stängt och aldrig faller in i operating-company-motorn.

## Releaseprincip

- Full live Analyst-körning görs endast när den behövs för att certifiera en metodikfamilj eller en ändrad runtime-boundary.
- Käll-/parserpatchar verifieras först med deterministiska tester och riktad live Research-diagnostik.
- En redan certifierad canary återkörs inte efter varje liten ändring om dess kodväg är orörd och regressionssviten täcker kontraktet.
- Vercel används för runtime/release-verifiering, inte som edit-loop.
- Inga analyser publiceras eller persisteras under certifiering om detta inte uttryckligen ingår i en separat godkänd releaseplan.

## On-demand-modell för betalande produkt

När Analys senare blir en betalfunktion ska användarens valda bolag trigga riktig research on demand. Motorn ska då:

1. identifiera instrument och metodikfamilj;
2. samla bounded, verifierbara källor;
3. stoppa fail-closed om metodik eller evidens inte räcker;
4. endast gå vidare till Analyst när Research-grindarna är uppfyllda;
5. aldrig skapa ett resultat för att uppfylla en kvot eller för att bolaget råkar vara betalt.

DivLab ska alltså inte förberäkna analyser för alla världens bolag.

## Förhållande till monsterpasset

Monsterpasset är fortsatt giltigt som observationsregister och används för att förstå tidigare funna luckor. Planen i äldre mastertillägg om en ny full 27-måls regression är härmed överspelad. Endast en ny bred stresstestkörning får göras om en framtida arkitekturändring motiverar det uttryckligen.

## Definition av klart för nuvarande byggfas

Nuvarande analysbyggfas är klar när:

- Decision 4:s Nordic release-evidence-kontrakt är verifierat;
- Investor och EQT når sina specialist-Research-grindar eller har en exakt, källbunden blocker som kräver en separat metodikversion;
- SEB:s bankflöde når Research-ready, eller den sista kvarvarande bankblockern är isolerad till en explicit Fact Book/current-column-källa som dokumenteras och inte kan lösas säkert inom befintligt source contract;
- Volvo- och Microsoft-certifieringarna fortsatt är giltiga och deras kontrakt inte har brutits;
- inga P0-säkerhetsfel finns;
- inga quality gates har sänkts;
- ingen oavsiktlig persistence/publication har öppnats.
