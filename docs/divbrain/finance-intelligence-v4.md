# DivBrain Finance Intelligence v4

Finance Intelligence v4 is a deterministic expert-routing layer in front of the existing DivBrain AI Gateway provider.

## Why

A general LLM can know finance vocabulary yet still answer at the wrong abstraction level. The motivating regression was a request for technical-analysis tools being answered primarily with a charting platform. The correct semantic distinction is:

- **analysis methods/tools**: market structure, moving averages, RSI, MACD, ADX, ATR, volume/OBV/CMF, VWAP/Volume Profile, support/resistance, relative strength, breakout/mean reversion, volatility and risk sizing;
- **software/platforms**: TradingView, Börsdata, Koyfin, Finviz, MarketScreener, Bloomberg, FactSet, LSEG Workspace, Avanza/Nordnet, etc.

A platform can host analytical tools but is not itself the analytical method.

## Architecture

`lib/divbrain/server/finance/intelligence.ts` performs a local classification of the latest user turn and selects one compact expert playbook. It adds no external request, no second LLM call, no embeddings and no database read.

Covered routes:

- technical analysis
- platforms/data terminals
- fundamental company analysis
- valuation
- accounting/report reading
- portfolio/risk
- funds/ETFs
- fixed income
- macro/rates
- derivatives/options
- dividends
- trading/execution
- personal finance
- tax/legal informational questions
- market data/source quality
- general finance

The provider mapper injects only the relevant playbook into the server-side system context. This keeps token overhead bounded compared with shipping a whole finance encyclopedia on every turn.

## Quality rules

The specialist layer requires DivBrain to:

1. answer at the abstraction level requested;
2. explain what an analytical tool measures, when it helps and its main limitation;
3. avoid single-indicator trading logic;
4. distinguish signal generation from execution and risk sizing;
5. triangulate valuation rather than rely on one multiple;
6. connect all three financial statements for accounting questions;
7. treat current prices, platform pricing/features, tax rules and market data as freshness-sensitive;
8. prefer primary sources for critical facts.

## Source hierarchy

When current/verified information is available, preference is:

1. regulator/company IR/central bank/statistics authority;
2. exchange or official market-data source;
3. established data/news provider;
4. aggregators/community as discovery only.

Examples already supported elsewhere in DivLab include SEC EDGAR/XBRL. Future retrieval adapters can add ECB SDMX, central-bank/statistics data and the shared model-portfolio research store without changing this semantic router.

## Cost boundary

Finance Intelligence v4 intentionally keeps the existing one-provider-generation request model. It does **not** turn DivBrain into an uncontrolled multi-step agent. This preserves the existing Cost Guard reservation model while improving domain specificity.

A later explicitly budgeted tool-calling phase can expose live/retrieved data tools once their source rights, freshness semantics, quotas and accounting are separately proven.
