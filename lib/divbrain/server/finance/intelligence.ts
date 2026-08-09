import "server-only";

/**
 * DivBrain Finance Intelligence v4.
 *
 * Deterministic domain router + compact expert playbooks. This layer performs
 * no network request and no additional model call. It exists to give the
 * provider the right professional vocabulary, distinctions and workflows for
 * the current finance question instead of relying on a generic one-shot prompt.
 */

export const DIVBRAIN_FINANCE_INTELLIGENCE_VERSION = "finance-intelligence-v4" as const;

export type FinanceIntent =
  | "technical_analysis"
  | "platforms"
  | "fundamental_analysis"
  | "valuation"
  | "accounting"
  | "portfolio_risk"
  | "funds_etfs"
  | "fixed_income"
  | "macro"
  | "derivatives"
  | "dividends"
  | "trading_execution"
  | "personal_finance"
  | "tax_legal"
  | "market_data"
  | "general_finance";

export type FinanceToolMeaning = "methods" | "platforms" | "ambiguous";

export type FinanceIntelligencePlan = {
  version: typeof DIVBRAIN_FINANCE_INTELLIGENCE_VERSION;
  intent: FinanceIntent;
  toolMeaning: FinanceToolMeaning;
  currentDataLikelyRequired: boolean;
  context: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFC")
    .toLocaleLowerCase("sv-SE")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

function hasAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

const INTENT_TERMS: Record<Exclude<FinanceIntent, "general_finance">, readonly string[]> = {
  technical_analysis: [
    "teknisk analys", "tekniska analys", "ta ", "rsi", "macd", "adx", "atr", "bollinger",
    "stochastic", "glidande medel", "moving average", "sma", "ema", "vwap", "volume profile",
    "volymprofil", "stöd", "motstånd", "support", "resistance", "breakout", "trendlinje",
    "candlestick", "ljusstake", "momentum", "relative strength", "marknadsstruktur",
  ],
  platforms: [
    "tradingview", "börsdata", "borsdata", "koyfin", "finviz", "marketscreener", "stockcharts",
    "bloomberg terminal", "factset", "refinitiv", "lseg workspace", "avanza", "nordnet",
    "plattform", "program för", "programvara", "screener", "screeningverktyg", "charting",
  ],
  fundamental_analysis: [
    "fundamental", "bolagsanalys", "analysera bolag", "kvalitetsbolag", "moat", "konkurrensfördel",
    "roic", "roe", "roa", "marginal", "omsättningstillväxt", "vinsttillväxt", "kassaflöde",
    "balansräkning", "nettoskuld", "skuldsättning", "capex", "working capital", "rörelsekapital",
  ],
  valuation: [
    "värdering", "värdera", "dcf", "wacc", "terminal value", "terminalvärde", "p/e", "pe-tal",
    "ev/ebit", "ev/ebitda", "p/s", "p/b", "p/fcf", "fcf yield", "multipel", "multiplar",
    "intrinsic value", "fair value", "rimligt värde", "reverse dcf",
  ],
  accounting: [
    "redovisning", "resultaträkning", "balansräkning", "kassaflödesanalys", "ebit", "ebitda",
    "bruttovinst", "rörelseresultat", "goodwill", "nedskrivning", "avskrivning", "lager",
    "kundfordringar", "free cash flow", "fritt kassaflöde", "eps", "vinst per aktie",
  ],
  portfolio_risk: [
    "portfölj", "riskspridning", "diversifier", "korrelation", "beta", "sharpe", "sortino",
    "drawdown", "max drawdown", "volatilitet", "position sizing", "positionsstorlek", "risk per trade",
    "var", "value at risk", "cvar", "expected shortfall", "rebalanser", "allokering",
  ],
  funds_etfs: [
    "etf", "fond", "indexfond", "aktiv fond", "förvaltningsavgift", "tracking error", "tracking difference",
    "ucits", "syntetisk etf", "fysisk etf", "fondrobot", "investmentbolag",
  ],
  fixed_income: [
    "obligation", "ränta", "yield", "duration", "modifierad duration", "konvexitet", "convexity",
    "kreditspread", "credit spread", "yield to maturity", "ytm", "kupong", "nollkupong",
  ],
  macro: [
    "makro", "inflation", "kpi", "kpif", "cpi", "pce", "pmi", "gdp", "bnp", "arbetslöshet",
    "centralbank", "central bank", "riksbanken", "fed", "ecb", "styrränta", "yield curve",
    "räntekurva", "penningpolitik", "konjunktur", "realränta", "breakeven inflation",
  ],
  derivatives: [
    "option", "call", "put", "covered call", "protective put", "straddle", "strangle", "spread",
    "delta", "gamma", "theta", "vega", "implied volatility", "implicit volatilitet", "termin",
    "futures", "forward", "warrant", "turbo", "certifikat", "knock-out",
  ],
  dividends: [
    "utdelning", "direktavkastning", "payout", "utdelningsandel", "utdelningstäckning", "ex-dag",
    "x-dag", "utdelningstillväxt", "yield trap", "återköp", "buyback",
  ],
  trading_execution: [
    "limit order", "limitorder", "market order", "marknadsorder", "stop loss", "stop-loss", "spread",
    "bid", "ask", "orderbok", "slippage", "likviditet", "volym", "execution", "exekvering",
    "daytrading", "swingtrading", "swing trading", "trade", "trading",
  ],
  personal_finance: [
    "sparkvot", "budget", "buffert", "amortera", "bolån", "fire", "ekonomisk frihet", "pension",
    "premiepension", "tjänstepension", "månadsspar", "ränta på ränta",
  ],
  tax_legal: [
    "isk", "kapitalförsäkring", "kf", "depå", "skatt", "källskatt", "schablonskatt", "deklaration",
    "kvitta", "avdrag", "juridik", "regelverk", "mifid", "priips",
  ],
  market_data: [
    "aktiekurs", "kurs idag", "livekurs", "realtid", "realtime", "börskurs", "historisk kurs",
    "market data", "marknadsdata", "orderdjup", "nivå 2", "level 2",
  ],
};

const CURRENT_TERMS = [
  "idag", "just nu", "nuvarande", "senaste", "live", "realtid", "realtime", "den här veckan",
  "denna vecka", "2026", "pris", "kostar", "avgift idag", "kurs", "rapport idag", "senaste rapport",
];

const METHOD_WORDS = [
  "indikator", "indikatorer", "analysverktyg", "analysmetod", "analysmetoder", "signal", "signaler",
  "mått", "nyckeltal", "metod", "metoder", "tekniska verktyg",
];
const PLATFORM_WORDS = [
  "plattform", "plattformar", "program", "programvara", "app", "appar", "webbsida", "sajt",
  "tjänst", "terminal", "mjukvara", "screeners", "screener",
];

function classifyToolMeaning(text: string): FinanceToolMeaning {
  const methods = hasAny(text, METHOD_WORDS);
  const platforms = hasAny(text, PLATFORM_WORDS);
  if (methods && !platforms) return "methods";
  if (platforms && !methods) return "platforms";
  return "ambiguous";
}

function classifyIntent(text: string): FinanceIntent {
  // Specific analytical domains win over generic platform/trading vocabulary.
  const priority: FinanceIntent[] = [
    "technical_analysis", "valuation", "fundamental_analysis", "accounting", "derivatives",
    "fixed_income", "macro", "portfolio_risk", "funds_etfs", "dividends", "tax_legal",
    "personal_finance", "market_data", "platforms", "trading_execution",
  ];
  for (const intent of priority) {
    if (intent === "general_finance") continue;
    if (hasAny(text, INTENT_TERMS[intent])) return intent;
  }
  return "general_finance";
}

const TECHNICAL_PLAYBOOK = `
FINANSVERKTYG — TEKNISK ANALYS
När användaren ber om tekniska analysverktyg betyder "verktyg" normalt analysmetoder/indikatorer, inte en webbplattform. Börja därför med analysverktygen. En plattform som TradingView är endast ett sätt att använda dem.
Arbeta i lager och undvik enindikatorsignaler:
1. Marknadsstruktur: högre toppar/bottnar, trend/range, stöd och motstånd, breakout/retest.
2. Trend: SMA/EMA 20/50/200, lutning och prisets relation till medelvärden. Korsningar är sekundära, inte köpbevis.
3. Trendstyrka: ADX/DMI skiljer stark trend från sidledes marknad; ADX anger styrka, inte riktning.
4. Momentum: RSI14, MACD, ROC och relativ styrka mot relevant index/sektor. RSI överköpt/översåld är kontext, inte automatisk reversal.
5. Volatilitet/risk: ATR, Bollinger Bands, historisk volatilitet och drawdown. ATR är användbart för stop-/positionsavstånd men säger inte riktningen.
6. Volym: relativ volym, OBV, Chaikin Money Flow, VWAP där intradagsdata finns, samt Volume Profile för aktivitet per prisnivå. Volym ska bekräfta prisrörelsen.
7. Breakout/mean reversion: Donchian/20-55-dagars highs/lows, z-score mot medelvärde och Bollinger; välj logik efter marknadsregim.
8. Multi-timeframe: definiera huvudtrend på längre timeframe och timing på kortare. Undvik att blanda signaler från timeframes utan plan.
9. Risk först: invalidationsnivå, förväntad nedsida, likviditet och position sizing före entry.
Ett starkt praktiskt svar ska för varje föreslaget verktyg säga VAD det mäter, NÄR det är användbart och VANLIG FELTOLKNING. Ge gärna ett konkret workflow, t.ex. struktur → trend → momentum/volym → volatilitet → risk/entry.
`;

const PLATFORM_PLAYBOOK = `
FINANSVERKTYG — PLATTFORMAR OCH DATA
Skilj alltid plattform från analysmetod. Beskriv vad plattformen är bra för och vilka databegränsningar som kan finnas; hitta aldrig på aktuell prisplan eller live-dataåtkomst.
- TradingView: charting/teknisk analys, indikatorer, ritverktyg, screeners och Pine Script. Bra arbetsyta för teknisk analys; inte i sig en indikator.
- Börsdata: nordiskt bolags-/nyckeltalsfokus, fundamental screening, historiska nyckeltal och jämförelser. Använd för fundamental research när täckningen passar.
- Koyfin: multi-asset research, dashboards, fundamental/makrovisualisering och screening; användbar för korsmarknadsanalys.
- Finviz: snabb USA-aktiescreening, heatmaps och teknisk/fundamental filtrering; kontrollera alltid datapunktens aktualitet/täckning.
- MarketScreener: bolagsöversikter, konsensus/estimat, nyheter och screening; sekundär källa, verifiera kritiska siffror mot bolagsrapport/filing.
- Bloomberg / FactSet / LSEG Workspace: professionella terminal-/dataplattformar med bred marknads-, fundamental- och nyhetsdata; funktion/täckning beror på licens.
- Avanza / Nordnet: mäklare och depåplattformar med orderläggning, portföljvy och viss bolagsdata; inte ersättning för en full researchterminal.
Om användaren frågar "vilken plattform?", jämför utifrån marknadstäckning, fundamental vs teknisk analys, screening, export/API, realtidsbehov, användarvänlighet och kostnad — men aktuella priser/funktioner måste verifieras färskt.
`;

const FUNDAMENTAL_PLAYBOOK = `
FINANSVERKTYG — BOLAGSANALYS
Analysera i ordningen affär → kvalitet → finanser → värdering → risk → katalysator, inte bara P/E.
Affär: intäktsmodell, kunder, pricing power, cyklikalitet, konkurrens, moat och kapitalintensitet.
Kvalitet: organisk tillväxt, brutto-/EBIT-marginal, ROIC/ROE, incremental margins, återkommande intäkter, kundkoncentration.
Kassaflöde: CFO, capex, FCF, FCF conversion, working-capital-effekter, SBC där relevant.
Balans: nettoskuld/EBITDA, räntetäckning, förfallostruktur, likviditet, goodwill och finansieringsbehov.
Per aktie: EPS/FCF per aktie och utspädning; skilj total bolagstillväxt från värdeskapande per aktie.
Ledning/allokering: förvärv, återköp, utdelning, investeringar och historik av guidance/utfall.
Red flags: receivables/lager växer snabbare än försäljning, återkommande "engångsposter", svag cash conversion, hög aktivering, aggressiv justerad EBITDA, stigande skuld trots redovisad vinst.
`;

const VALUATION_PLAYBOOK = `
FINANSVERKTYG — VÄRDERING
Välj metod efter bolagets ekonomi. Använd helst flera triangulerande metoder.
- P/E: användbart för stabilt positivt nettoresultat; påverkas av kapitalstruktur, skatt och engångsposter.
- EV/EBIT och EV/EBITDA: jämför verksamheten oberoende av kapitalstruktur; EBITDA bortser från capex och kan smickra kapitalintensiva bolag.
- P/FCF och FCF yield: kopplar pris till kassaflöde; normalisera working capital/capex.
- EV/Sales: kan vara relevant före lönsamhet men kräver explicit marginalantagande.
- P/B: mer relevant för vissa finansiella/balansdrivna verksamheter än för asset-light bolag.
- DCF: värde = nuvärde av framtida fria kassaflöden + terminalvärde; redovisa tillväxt, marginal, reinvestering, WACC och terminalantagande och gör känslighetsanalys.
- Reverse DCF: lös ut vilken tillväxt/marginal marknadspriset kräver; ofta bättre för att förstå förväntningar än ett enda punktestimat.
Jämför historiska multiplar och peers först efter att skillnader i tillväxt, marginal, ROIC, risk och redovisning beaktats. Billig multipel kan vara value trap; hög multipel kan vara rationell om uthållig ROIC/tillväxt motiverar den.
`;

const ACCOUNTING_PLAYBOOK = `
FINANSVERKTYG — REDOVISNING OCH RAPPORTLÄSNING
Knyt ihop resultat, balans och kassaflöde. Kontrollera alltid hur redovisad vinst blir kontanter.
Resultat: omsättning → bruttovinst → EBIT → finansnetto/skatt → nettoresultat/EPS.
Kassaflöde: CFO - normaliserat capex ≈ FCF (definitioner varierar). Separera maintenance/growth capex när underlag finns.
Balans: cash, rörelsekapital, materiella/immateriella tillgångar, goodwill, skuld, lease liabilities och eget kapital.
Nyckelbroar: EBITDA→EBIT (D&A), EBIT→net income (ränta/skatt), net income→CFO (icke-kassaposter + working capital), CFO→FCF (capex).
Var skeptisk till justerade mått om återkommande kostnader konsekvent exkluderas.
`;

const PORTFOLIO_PLAYBOOK = `
FINANSVERKTYG — PORTFÖLJ OCH RISK
Avkastning utan riskmått är ofullständig. Relevanta verktyg: CAGR/total return, annualiserad volatilitet, max drawdown, Sharpe, Sortino, beta, korrelation/covarians och koncentration.
Diversifiering handlar om riskdrivare, inte bara antal innehav. Två olika tickers kan ha samma faktor-/sektor-/räntesensitivitet.
Position sizing: definiera max acceptabel förlust och invalidationsavstånd; positionsstorlek ≈ riskbudget / risk per aktie. Likviditet och gaprisk gör utfallet osäkrare.
Sharpe använder total volatilitet; Sortino fokuserar downside-volatilitet. Beta mäter samvariation med benchmark och är inte total risk.
VaR är ett kvantilmått med modellrisk och säger lite om hur illa svansen kan bli; Expected Shortfall/CVaR beskriver genomsnittlig förlust bortom VaR-tröskeln.
`;

const FIXED_INCOME_PLAYBOOK = `
FINANSVERKTYG — RÄNTOR OCH OBLIGATIONER
Pris och yield rör sig normalt motsatt. YTM är internränteliknande avkastning om kassaflöden realiseras enligt antaganden och är inte samma sak som framtida realiserad avkastning.
Duration approximerar räntekänslighet; modifierad duration ger ungefärlig procentuell prisförändring för liten yieldförändring. Convexity förbättrar approximationen vid större rörelser.
Separera riskfri kurva, term premium, kreditspread, likviditet och optionalitet. Kreditobligationer har både ränte- och kreditrisk.
Analysera yield curve: nivå, lutning och kurvatur; koppla inte inversion mekaniskt till en exakt recessionstidpunkt.
`;

const MACRO_PLAYBOOK = `
FINANSVERKTYG — MAKRO
Bygg en kausal kedja: data → förväntningar → räntor/valuta → finansieringsvillkor → vinster/värderingsmultiplar.
Inflation: skilj headline/core, varor/tjänster och nivå mot förändringstakt. Arbetsmarknad: payrolls/sysselsättning, arbetslöshet, deltagande, löner och revisionsrisk.
Tillväxt: BNP är eftersläpande; PMI/ISM, order, kredit och finansiella villkor kan vara mer framåtblickande men är brusiga.
Räntor: nominell ränta ≈ realränta + inflationskompensation; marknadsräntor innehåller dessutom risk-/term premiums.
Primärkällor ska prioriteras: centralbanker/statistikmyndigheter. FRED är en distributions-/databasplattform; ECB har SDMX-webbtjänst; World Bank Indicators API har bred strukturell data.
`;

const DERIVATIVES_PLAYBOOK = `
FINANSVERKTYG — DERIVAT
Optioner kräver minst riktning, tid och volatilitet. Call ger rätt att köpa, put rätt att sälja enligt kontraktsvillkor.
Intrinsic value och time value ska skiljas. Greeks: delta (lokal prisexponering), gamma (deltaförändring), theta (tidsvärdeserosion), vega (IV-känslighet), rho (räntekänslighet).
Implied volatility är marknadens prissatta volatilitet under modellantaganden, inte en prognosgaranti.
Strategier som covered call, protective put, vertical spread, straddle/strangle har olika payoff och tail risk; redovisa alltid maxvinst/maxförlust när de är begränsade samt assignment/gap/likviditetsrisk.
Komplexa hävstångsprodukter (warranter/turbos/certifikat) kräver även emittent-, finansierings-, spread- och knockout-risk.
`;

const DIVIDEND_PLAYBOOK = `
FINANSVERKTYG — UTDELNING
Direktavkastning ensam är ett svagt kvalitetsmått. Kontrollera payout ratio mot vinst OCH helst FCF coverage, skuld, cyklikalitet, kapitalbehov och utdelningshistorik.
En stigande yield kan bero på fallande aktiekurs och signalera yield trap. Totalavkastning = prisutveckling + utdelningar (med återinvestering beroende på måttet).
För utländska utdelningar måste kontotyp/källskatt behandlas som jurisdiktions- och tidsberoende information; aktuella regler ska verifieras.
`;

const TRADING_PLAYBOOK = `
FINANSVERKTYG — TRADING OCH EXEKVERING
Separera signal från exekvering. Bid/ask-spread, orderdjup, volym, slippage och gaprisk påverkar verklig fill.
Market order prioriterar genomförande, inte pris. Limit order sätter prisgräns men garanterar inte fill. Stop-order kan exekveras sämre än stopnivån vid gap/snabb marknad.
En tradeplan bör ha setup, trigger, invalidation, position size, exit-regler och max risk innan entry. Backtest måste beakta look-ahead bias, survivorship bias, överanpassning, avgifter/slippage och out-of-sample-test.
`;

const FUNDS_PLAYBOOK = `
FINANSVERKTYG — FONDER OCH ETF:ER
Bedöm exponering/indexmetod, avgift, tracking difference, tracking error, likviditet/spread, fondstorlek, domicil/skatt, fysisk/syntetisk replikering och securities lending.
ETF:s börspris och NAV är olika begrepp; spread och premium/discount kan spela roll. En låg avgift garanterar inte lägst faktisk tracking difference.
Indexfond vs aktiv fond bör jämföras på mandat, kostnad, koncentration, stil/faktorexponering och långsiktig nettoavkastning — inte bara senaste resultat.
`;

const TAX_PLAYBOOK = `
FINANSVERKTYG — SKATT/JURIDIK
Behandla alltid skatte- och regeluppgifter som tids- och jurisdiktionskänsliga. För Sverige: skilj ISK, kapitalförsäkring och depå på ägande, schablon-/kapitalbeskattning, deklarationshantering, källskatt och kvittningslogik, men verifiera aktuella nivåer/regler innan exakta påståenden.
Ge allmän information, inte individuell skatte-/juridisk rådgivning.
`;

const DATA_PLAYBOOK = `
FINANSVERKTYG — KÄLLOR OCH MARKNADSDATA
Källhierarki: 1) regulatoriska filings/bolagets IR/centralbank/statistikmyndighet, 2) börs/exchange och officiell marknadsdata, 3) etablerade dataleverantörer/nyhetskällor, 4) aggregat/community endast som discovery.
För USA-filings är SEC EDGAR/data.sec.gov primärkälla för submissions och XBRL Company Facts. För makro använd primärkällan när möjligt; ECB Data Portal erbjuder SDMX-data och World Bank Indicators API strukturell data.
Skilj realtid, delayed, EOD och historik. Presentera aldrig delayed/EOD som exakt livekurs eller exekveringspris. Ange data-as-of när aktualitet spelar roll.
`;

const PERSONAL_FINANCE_PLAYBOOK = `
FINANSVERKTYG — PRIVATEKONOMI
Prioritera robust ordning: kassaflöde/budget → buffert → dyr skuld/risk → försäkringsbehov → långsiktigt sparande → pension/skatt. Ränta-på-ränta påverkas av avkastning, tid, avgifter, skatt och insättningar.
FIRE-beräkningar är scenarioanalys, inte garanti; testa uttagsnivå mot inflation, sekvensrisk, avgifter/skatt, pension och flexibilitet.
`;

const GENERAL_PLAYBOOK = `
FINANSVERKTYG — GENERELL ANALYSDISCIPLIN
Identifiera först om frågan gäller bolag, värdering, pris/teknik, portföljrisk, makro, instrument, exekvering, plattform eller skatteregler. Svara med verktyg från rätt nivå.
Förklara mekanismen, inte bara namnet. När flera metoder finns: säg när respektive metod fungerar och var den kan vilseleda. Separera fakta från slutsats och aktuell data från tidlös kunskap.
`;

const PLAYBOOKS: Record<FinanceIntent, string> = {
  technical_analysis: TECHNICAL_PLAYBOOK,
  platforms: PLATFORM_PLAYBOOK,
  fundamental_analysis: FUNDAMENTAL_PLAYBOOK,
  valuation: VALUATION_PLAYBOOK,
  accounting: ACCOUNTING_PLAYBOOK,
  portfolio_risk: PORTFOLIO_PLAYBOOK,
  funds_etfs: FUNDS_PLAYBOOK,
  fixed_income: FIXED_INCOME_PLAYBOOK,
  macro: MACRO_PLAYBOOK,
  derivatives: DERIVATIVES_PLAYBOOK,
  dividends: DIVIDEND_PLAYBOOK,
  trading_execution: TRADING_PLAYBOOK,
  personal_finance: PERSONAL_FINANCE_PLAYBOOK,
  tax_legal: TAX_PLAYBOOK,
  market_data: DATA_PLAYBOOK,
  general_finance: GENERAL_PLAYBOOK,
};

function secondaryPlaybook(intent: FinanceIntent, text: string): string {
  if (intent === "technical_analysis" && hasAny(text, INTENT_TERMS.platforms)) return PLATFORM_PLAYBOOK;
  if (intent === "platforms" && hasAny(text, INTENT_TERMS.technical_analysis)) return TECHNICAL_PLAYBOOK;
  if (intent === "fundamental_analysis" && hasAny(text, INTENT_TERMS.valuation)) return VALUATION_PLAYBOOK;
  if (intent === "valuation" && hasAny(text, INTENT_TERMS.accounting)) return ACCOUNTING_PLAYBOOK;
  if (intent === "portfolio_risk" && hasAny(text, INTENT_TERMS.trading_execution)) return TRADING_PLAYBOOK;
  return "";
}

export function buildFinanceIntelligencePlan(message: string): FinanceIntelligencePlan | null {
  const text = normalize(message);
  if (!text) return null;

  const financeSignal = Object.values(INTENT_TERMS).some((terms) => hasAny(text, terms));
  if (!financeSignal && !hasAny(text, ["aktie", "börs", "investera", "investering", "ekonomi", "finans"])) {
    return null;
  }

  const intent = classifyIntent(text);
  const toolMeaning = classifyToolMeaning(text);
  const currentDataLikelyRequired = hasAny(text, CURRENT_TERMS);
  const primary = PLAYBOOKS[intent];
  const secondary = secondaryPlaybook(intent, text);

  const semanticRule = toolMeaning === "methods"
    ? "SEMANTISK TOLKNING: användaren efterfrågar analysmetoder/indikatorer. Ge konkreta metoder först; plattformar är sekundära exempel."
    : toolMeaning === "platforms"
      ? "SEMANTISK TOLKNING: användaren efterfrågar program/plattformar. Jämför konkreta plattformar efter användningsfall och databehov."
      : "SEMANTISK TOLKNING: ordet verktyg kan vara tvetydigt. Avgör från resten av frågan om metoder eller plattformar avses; om båda är relevanta, separera dem tydligt.";

  const freshness = currentDataLikelyRequired
    ? "AKTUALITET: frågan verkar kunna kräva färsk data. Hitta inte på aktuella priser, avgifter, kurser, regler eller plattformsfunktioner. Använd endast verifierad aktuell källa om sådan finns i underlaget; annars markera begränsningen."
    : "AKTUALITET: tidlös metodkunskap kan förklaras utan live-data; gör inga onödiga påståenden om dagens priser/funktioner.";

  return {
    version: DIVBRAIN_FINANCE_INTELLIGENCE_VERSION,
    intent,
    toolMeaning,
    currentDataLikelyRequired,
    context: [
      `DIVBRAIN FINANCE SPECIALIST ROUTE: ${intent}`,
      semanticRule,
      freshness,
      "KVALITETSKRAV: ge inte ett generiskt produktnamn som ersättning för den metod användaren frågar efter. Beskriv vad verktyget mäter/gör, när det hjälper, viktig begränsning och hur det kombineras med andra signaler när det är relevant.",
      primary.trim(),
      secondary.trim(),
    ].filter(Boolean).join("\n\n"),
  };
}
