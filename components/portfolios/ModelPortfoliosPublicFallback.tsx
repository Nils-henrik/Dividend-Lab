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
        Fyra AI-portföljer. Fyra olika strategier.
      </h1>
      <p className="text-sm leading-7 text-divlab-text-secondary">
        DivLab har byggt fyra separata AI-förvaltade modellportföljer med varsin
        investeringsstrategi: Försiktig, Medelrisk, Högrisk och Utdelning.
        Portföljerna gick live den {MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL} och har
        därför fortfarande en kort historik. Varje AI arbetar inom sitt eget mandat,
        analyserar marknaden och dokumenterar varför en modellaffär föreslås eller
        genomförs.
      </p>
      <p className="text-sm leading-6 text-divlab-text-muted">
        Live-siffror är tillfälligt otillgängliga. Strategierna och processen kan
        fortfarande läsas. Detta är allmän information om modellportföljer – inte
        personlig investeringsrådgivning.
      </p>
      <ul className="space-y-4">
        {MODEL_PORTFOLIO_PUBLIC_CATALOG.map((portfolio) => (
          <li key={portfolio.slug}>
            <Link
              href={`/portfolios/${portfolio.slug}`}
              className="font-semibold text-divlab-text hover:text-divlab-blue"
            >
              {portfolio.name}
            </Link>
            <p className="mt-1 text-sm leading-6 text-divlab-text-secondary">
              {portfolio.summary}
            </p>
          </li>
        ))}
      </ul>
      <Link
        href={MODEL_PORTFOLIO_PROCESS_PATH}
        className="inline-flex text-sm font-semibold text-divlab-blue hover:text-divlab-blue-muted"
      >
        Så arbetar DivLabs AI-portföljer →
      </Link>
    </div>
  );
}

export function PortfolioDetailPublicFallback({
  entry,
}: {
  entry: ModelPortfolioPublicCatalogEntry;
}) {
  const mandate = MODEL_PORTFOLIO_MANDATES[entry.strategyKey];
  const turnover = MODEL_PORTFOLIO_TURNOVER_POLICY[entry.strategyKey];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
        <Link href="/portfolios" className="hover:text-divlab-text">
          AI-portföljer
        </Link>
        <span>/</span>
        <span className="text-divlab-text-secondary">{entry.name}</span>
      </div>
      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">
        {entry.name}
      </h1>
      <p className="text-sm leading-7 text-divlab-text-secondary">{entry.summary}</p>
      <p className="text-xs leading-5 text-divlab-text-muted">
        Simulerad AI-portfölj, live sedan {MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL}.
        Live-historik är tillfälligt otillgänglig. Inte personlig rådgivning.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-divlab-text">
          Så arbetar {entry.name}-AI:n
        </h2>
        <p className="text-sm leading-7 text-divlab-text-secondary">
          {mandate.objective}
        </p>
        <p className="text-sm leading-6 text-divlab-text-muted">
          Minsta affär {turnover.minTradePctOfPortfolio}&nbsp;% · cooldown{" "}
          {turnover.cooldownHours} timmar · max {turnover.maxRunsPerTradingDay}{" "}
          beslutskörningar per handelsdag.
        </p>
      </section>
      <Link
        href={MODEL_PORTFOLIO_PROCESS_PATH}
        className="inline-flex text-sm font-semibold text-divlab-blue hover:text-divlab-blue-muted"
      >
        Så arbetar DivLabs AI-portföljer →
      </Link>
    </div>
  );
}
