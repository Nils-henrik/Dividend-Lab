import Link from "next/link";
import {
  MODEL_PORTFOLIO_PROCESS_PATH,
  MODEL_PORTFOLIO_PUBLIC_CATALOG,
  MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL,
  type ModelPortfolioPublicCatalogEntry,
} from "@/lib/model-portfolios/public";
import { MODEL_PORTFOLIO_MANDATES } from "@/lib/model-portfolios/engine/mandates";
import { MODEL_PORTFOLIO_TURNOVER_POLICY } from "@/lib/model-portfolios/engine/policy";

export function ModelPortfoliosPublicFallback() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-divlab-blue-muted">
        Nyligen lanserade · Live sedan {MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL}
      </p>
      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">
        Kan AI slå en traditionell aktieförvaltare?
      </h1>
      <p className="text-sm leading-7 text-divlab-text-secondary">
        På DivLab testar vi en enkel men spännande fråga: kan AI över tid fatta investeringsbeslut som står sig mot traditionell aktiv aktieförvaltning?
      </p>
      <div className="space-y-4 border divlab-border-neutral bg-divlab-surface/45 px-5 py-6 text-sm leading-7 text-divlab-text-secondary">
        <p>Därför har vi startat ett pilotprojekt med fyra AI-styrda portföljer, där varje portfölj får arbeta utifrån sin egen strategi, risknivå och sina egna regler.</p>
        <p>Varje portfölj startar med <strong className="font-semibold text-divlab-text">10 000 kronor</strong> och får därefter <strong className="font-semibold text-divlab-text">5 000 kronor i nytt kapital varje månad</strong>. Tanken är att efterlikna ett vanligt långsiktigt månadssparande och samtidigt ge AI:n möjlighet att bygga upp portföljen över tid.</p>
        <p>AI:n får själv söka efter bolag, analysera information och fatta beslut om när den vill köpa, behålla eller sälja. Portföljerna har olika inriktningar och ska därför inte nödvändigtvis hitta samma aktier eller fatta samma beslut.</p>
        <p><strong className="font-semibold text-divlab-text">Vi ändrar inte AI:ns investeringsbeslut i efterhand – oavsett om utfallet blir bra eller dåligt.</strong> Poängen med experimentet är att följa vad som faktiskt händer när AI får analysera marknaden och fatta egna investeringsbeslut utifrån tydliga regler. Resultatet får helt enkelt bli vad det blir.</p>
        <p>Alla köp, försäljningar, avgifter och förändringar i portföljvärdet följs öppet på DivLab. Det gör att utvecklingen går att följa över både bra och dåliga perioder.</p>
        <div className="border-t divlab-border-neutral pt-5">
          <h2 className="text-xl font-semibold text-divlab-text">Vad vill vi ta reda på?</h2>
          <p className="mt-3">Det intressanta är inte om AI lyckas hitta en enskild vinnare. Det vi vill se är om AI under flera år kan hitta intressanta investeringar, hantera risk, reagera på ny information, undvika dåliga beslut, bygga en fungerande portfölj och prestera konkurrenskraftigt mot traditionell aktiv aktieförvaltning.</p>
          <p className="mt-3"><strong className="font-semibold text-divlab-text">Det här är alltså inte fyra modellportföljer som ska visa hur du bör investera. Det är ett öppet experiment.</strong></p>
          <p className="mt-2 font-semibold text-divlab-text">Vi vet inte hur det kommer att sluta. Och det är precis därför vi gör det.</p>
        </div>
      </div>
      <p className="text-sm leading-6 text-divlab-text-muted">
        Live-siffror är tillfälligt otillgängliga. Strategierna och processen kan fortfarande läsas. Detta är allmän information om simulerade modellportföljer – inte personlig investeringsrådgivning.
      </p>
      <ul className="space-y-4">
        {MODEL_PORTFOLIO_PUBLIC_CATALOG.map((portfolio) => (
          <li key={portfolio.slug}>
            <Link href={`/portfolios/${portfolio.slug}`} className="font-semibold text-divlab-text hover:text-divlab-blue">
              {portfolio.name}
            </Link>
            <p className="mt-1 text-sm leading-6 text-divlab-text-secondary">{portfolio.summary}</p>
          </li>
        ))}
      </ul>
      <Link href={MODEL_PORTFOLIO_PROCESS_PATH} className="inline-flex text-sm font-semibold text-divlab-blue hover:text-divlab-blue-muted">
        Så arbetar DivLabs AI-portföljer →
      </Link>
    </div>
  );
}

export function PortfolioDetailPublicFallback({ entry }: { entry: ModelPortfolioPublicCatalogEntry; }) {
  const mandate = MODEL_PORTFOLIO_MANDATES[entry.strategyKey];
  const turnover = MODEL_PORTFOLIO_TURNOVER_POLICY[entry.strategyKey];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
        <Link href="/portfolios" className="hover:text-divlab-text">AI-portföljer</Link>
        <span>/</span>
        <span className="text-divlab-text-secondary">{entry.name}</span>
      </div>
      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">{entry.name}</h1>
      <p className="text-sm leading-7 text-divlab-text-secondary">{entry.summary}</p>
      <p className="text-xs leading-5 text-divlab-text-muted">
        Simulerad AI-portfölj, live sedan {MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL}. Live-historik är tillfälligt otillgänglig. Inte personlig rådgivning.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-divlab-text">Så arbetar {entry.name}-AI:n</h2>
        <p className="text-sm leading-7 text-divlab-text-secondary">{mandate.objective}</p>
        <p className="text-sm leading-6 text-divlab-text-muted">
          Minsta affär {turnover.minTradePctOfPortfolio}&nbsp;% · cooldown {turnover.cooldownHours} timmar · max {turnover.maxRunsPerTradingDay} beslutskörningar per handelsdag.
        </p>
      </section>
      <Link href={MODEL_PORTFOLIO_PROCESS_PATH} className="inline-flex text-sm font-semibold text-divlab-blue hover:text-divlab-blue-muted">
        Så arbetar DivLabs AI-portföljer →
      </Link>
    </div>
  );
}