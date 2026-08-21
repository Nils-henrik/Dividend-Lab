# DivLab Master Update — GitHub Yahoo Session Diagnostic v1

**Datum:** 2026-08-15  
**Status:** intern validation checkpoint

GitHub peer-research runner v1 passerade full Quality Gate #816 på `61cc9de799ec7c47da7e5fe65f6f45ee9956ad37`, men två riktiga exportförsök på separata hosted runners (`westus2` och `eastus`) failade identiskt på `MTRS.ST` med `financial_statements_unavailable`. Artifact-upload skippades korrekt och ingen write gjordes.

Eftersom Yahoo chart-history fungerar men financial statements kräver befintlig crumb+cookie-session införs en smal runner-diagnos som anropar exakt `getYahooCrumbSession(fetch, runStartedAt)` före peer-loopen.

Regler:
- ingen ny Yahoo-endpoint,
- ingen cookie/crumb får loggas eller persistieras,
- endast `ready` eller `peer_research_export_yahoo_session_unavailable` får exponeras,
- sessionen skapas av befintlig produktionskod och återanvänds genom dess in-process-cache,
- om session saknas stoppas körningen före peer research och inget artifact skapas,
- inga DB-, AI- eller Vercel-credentials tillkommer.

Request `atlas-copco-2026-08-15-02` används för exakt en ny push-triggerad diagnoskörning.

Om sessionen är unavailable även där betraktas GitHub-hosted Actions som olämplig Yahoo quoteSummary-fetchmiljö i nuvarande arkitektur; lösningen får då inte vara fler retries eller gissade Yahoo-varianter. Fetch-miljö och operatortransport ska hållas separata och fail-closed.
