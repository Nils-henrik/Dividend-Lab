import Link from "next/link";
import { DivLabAnalysisChart } from "./DivLabAnalysisChart";
import type { PublishedDivLabAnalysis } from "@/lib/analysis/public-read";
import type { DivLabAnalystClaim } from "@/lib/analysis/analyst-schema";

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function number(value: number | null | undefined, digits = 1): string {
  if (!finite(value)) return "—";
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function percent(value: number | null | undefined, digits = 1): string {
  if (!finite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${number(value * 100, digits)} %`;
}

function plainPercent(value: number | null | undefined, digits = 1): string {
  if (!finite(value)) return "—";
  return `${number(value * 100, digits)} %`;
}

function money(value: number | null | undefined, currency: string): string {
  if (!finite(value)) return "—";
  return `${number(value, value < 100 ? 2 : 1)} ${currency}`;
}

function date(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(parsed);
}

function viewCopy(view: "positive" | "neutral" | "negative") {
  if (view === "positive") return { label: "Positiv", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" };
  if (view === "negative") return { label: "Negativ", className: "border-red-400/30 bg-red-400/10 text-red-300" };
  return { label: "Neutral", className: "border-slate-400/30 bg-slate-400/10 text-slate-300" };
}

function riskLabel(value: "low" | "medium" | "high") {
  return value === "low" ? "Låg" : value === "high" ? "Hög" : "Medel";
}

function confidenceLabel(value: "low" | "medium" | "high") {
  return value === "low" ? "Låg" : value === "high" ? "Hög" : "Medel";
}

function regimeLabel(value: string) {
  return ({
    strong_uptrend: "Stark upptrend",
    uptrend: "Upptrend",
    neutral: "Neutral",
    downtrend: "Nedtrend",
    strong_downtrend: "Stark nedtrend",
    insufficient_data: "Otillräcklig data",
  } as Record<string, string>)[value] ?? value;
}

function sourceNumbers(analysis: PublishedDivLabAnalysis): Map<string, number> {
  return new Map(analysis.packet.sources.map((source, index) => [source.id, index + 1]));
}

function ClaimList({
  items,
  sources,
}: {
  items: readonly DivLabAnalystClaim[];
  sources: ReadonlyMap<string, number>;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item.text}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-300 sm:text-[15px]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
          <span>
            {item.text}{" "}
            {item.sourceIds.map((sourceId) => {
              const sourceNumber = sources.get(sourceId);
              return sourceNumber ? (
                <a
                  key={sourceId}
                  href={`#source-${sourceNumber}`}
                  className="ml-0.5 align-super text-[10px] font-semibold text-blue-400 hover:text-blue-300"
                >
                  [{sourceNumber}]
                </a>
              ) : null;
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-100">{value}</div>
      {hint ? <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  );
}

function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10 pt-8 sm:pt-10">
      {eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">{eyebrow}</div> : null}
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function DivLabAnalysisArticle({ analysis }: { analysis: PublishedDivLabAnalysis }) {
  const { packet, draft } = analysis;
  const currency = packet.instrument.currency;
  const view = viewCopy(draft.view);
  const sourceMap = sourceNumbers(analysis);
  const technical = packet.technical.snapshot;
  const nearestSupport = [...packet.technical.levels.supports].sort(
    (a, b) => Math.abs(a.distancePct) - Math.abs(b.distancePct),
  )[0];
  const nearestResistance = [...packet.technical.levels.resistances].sort(
    (a, b) => Math.abs(a.distancePct) - Math.abs(b.distancePct),
  )[0];
  const trailing = packet.valuation.trailing;
  const baseScenario = packet.valuation.scenarios.find((scenario) => scenario.name === "base");

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500" aria-label="Brödsmulor">
        <Link href="/" className="hover:text-slate-300">Hem</Link>
        <span>/</span>
        <Link href="/analyses" className="hover:text-slate-300">Analyser</Link>
        <span>/</span>
        <span className="truncate text-slate-400">{packet.instrument.name}</span>
      </nav>

      <header className="grid gap-7 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold text-blue-300">DivLab Analys</span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${view.className}`}>{view.label} syn</span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
            {packet.instrument.name}: aktieanalys
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
            Fundamental analys, värdering och teknisk analys med AI-tolkning. Analysen bygger på verifierade källor och fryst marknadsdata från analystillfället.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            <span>{packet.instrument.symbol}.{packet.instrument.exchange}</span>
            <span>Publicerad {date(analysis.publishedAt)}</span>
            <span>Data t.o.m. {date(packet.dataAsOf)}</span>
            <span>Version {analysis.versionNumber}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Kurs vid analys</div>
          <div className="mt-2 text-3xl font-semibold text-white">{money(packet.instrument.currentPrice, currency)}</div>
          {baseScenario && finite(baseScenario.valuePerShare) ? (
            <div className="mt-3 border-t border-white/10 pt-3 text-sm text-slate-400">
              Basscenario <span className="font-semibold text-slate-200">{money(baseScenario.valuePerShare, currency)}</span>
              {finite(baseScenario.upsideDownsidePct) ? (
                <span className={baseScenario.upsideDownsidePct >= 0 ? "ml-2 text-emerald-300" : "ml-2 text-red-300"}>
                  {percent(baseScenario.upsideDownsidePct)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Metric label="Risk" value={riskLabel(draft.riskLevel)} />
        <Metric label="AI-confidence" value={confidenceLabel(draft.confidence)} hint="Säkerhet i underlaget, inte kursprognosens träffsäkerhet." />
        <Metric label="Tidshorisont" value={`${draft.horizonMonths.min}–${draft.horizonMonths.max} mån`} />
      </div>

      <section className="mt-10 rounded-2xl border border-blue-400/15 bg-blue-400/[0.055] p-5 sm:p-7">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">DivLabs syn</div>
        <p className="mt-3 text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">{draft.executiveSummary}</p>
      </section>

      <div className="mt-10">
        <DivLabAnalysisChart
          model={packet.chart}
          symbol={packet.instrument.symbol}
          currency={currency}
          visibleSessions={160}
        />
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Trend" value={regimeLabel(technical.trend.regime)} />
        <Metric label="RSI 14" value={number(technical.momentum.rsi14, 1)} hint={finite(technical.momentum.rsi14) ? technical.momentum.rsi14 >= 70 ? "Överköpt område" : technical.momentum.rsi14 <= 30 ? "Översålt område" : "Neutralt momentumområde" : undefined} />
        <Metric label="Närmaste stöd" value={nearestSupport ? `${money(nearestSupport.lower, currency)}–${money(nearestSupport.upper, currency)}` : "—"} hint={nearestSupport ? `${nearestSupport.strength} · ${nearestSupport.touches} historiska test` : undefined} />
        <Metric label="Närmaste motstånd" value={nearestResistance ? `${money(nearestResistance.lower, currency)}–${money(nearestResistance.upper, currency)}` : "—"} hint={nearestResistance ? `${nearestResistance.strength} · ${nearestResistance.touches} historiska test` : undefined} />
      </div>

      <Section title="Teknisk analys" eyebrow="Prisbilden">
        <ClaimList items={draft.technicalInterpretation} sources={sourceMap} />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Kurs vs MA50" value={percent(technical.trend.priceVsSma50Pct)} />
          <Metric label="Kurs vs MA200" value={percent(technical.trend.priceVsSma200Pct)} />
          <Metric label="Volym vs 20 dagar" value={finite(technical.volume.volumeRatio20) ? `${number(technical.volume.volumeRatio20, 2)}×` : "—"} />
        </div>
      </Section>

      <Section title="Fundamental analys" eyebrow="Bolaget">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Fundamental score" value={finite(packet.fundamental.scorecard.overall) ? `${number(packet.fundamental.scorecard.overall, 1)}/10` : "—"} />
          <Metric label="Omsättning YoY" value={percent(packet.fundamental.metrics.revenueGrowthYoy)} />
          <Metric label="Rörelsemarginal" value={plainPercent(packet.fundamental.metrics.operatingMarginTtm)} />
          <Metric label="ROIC" value={plainPercent(packet.fundamental.metrics.returnOnInvestedCapital)} />
        </div>
        <div className="mt-6">
          <ClaimList items={draft.fundamentalInterpretation} sources={sourceMap} />
        </div>
      </Section>

      <Section title="Värdering" eyebrow="Vad betalar marknaden?">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="P/E" value={number(trailing.pe, 1)} />
          <Metric label="P/FCF" value={number(trailing.priceToFcf, 1)} />
          <Metric label="FCF yield" value={plainPercent(trailing.fcfYield)} />
          <Metric label="EV/EBITDA" value={number(trailing.evToEbitda, 1)} />
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {packet.valuation.scenarios.map((scenario) => {
            const scenarioClass = scenario.name === "bull"
              ? "border-emerald-400/20 bg-emerald-400/[0.045]"
              : scenario.name === "bear"
                ? "border-red-400/20 bg-red-400/[0.045]"
                : "border-blue-400/20 bg-blue-400/[0.045]";
            return (
              <div key={scenario.name} className={`rounded-2xl border p-5 ${scenarioClass}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{scenario.label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{money(scenario.valuePerShare, currency)}</div>
                <div className={finite(scenario.upsideDownsidePct) && scenario.upsideDownsidePct >= 0 ? "mt-1 text-sm text-emerald-300" : "mt-1 text-sm text-red-300"}>
                  {percent(scenario.upsideDownsidePct)} mot analyskurs
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-5 text-slate-400">
                  {scenario.assumptions.map((assumption) => <li key={assumption}>• {assumption}</li>)}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-7 space-y-3">
          {draft.valuationInterpretation.map((claim, index) => (
            <div key={`${claim.measure}-${index}`} className="text-sm leading-6 text-slate-300 sm:text-[15px]">
              {claim.text}{" "}
              {claim.sourceIds.map((sourceId) => {
                const sourceNumber = sourceMap.get(sourceId);
                return sourceNumber ? <a key={sourceId} href={`#source-${sourceNumber}`} className="ml-0.5 align-super text-[10px] font-semibold text-blue-400">[{sourceNumber}]</a> : null;
              })}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Investeringscaset" eyebrow="Vad måste gå rätt?">
        <ClaimList items={draft.investmentCase} sources={sourceMap} />
      </Section>

      <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 sm:mt-12 sm:grid-cols-2 sm:pt-10">
        <section>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Katalysatorer</div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-100">Det som kan driva caset</h2>
          <div className="mt-5"><ClaimList items={draft.catalysts} sources={sourceMap} /></div>
        </section>
        <section>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">Risker</div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-100">Det som kan gå fel</h2>
          <div className="mt-5"><ClaimList items={draft.risks} sources={sourceMap} /></div>
        </section>
      </div>

      <Section title="Vad skulle ändra vår syn?" eyebrow="Tesbrytare">
        <ClaimList items={draft.thesisBreakers} sources={sourceMap} />
        {draft.contradictions.length ? (
          <div className="mt-7 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
            <div className="text-sm font-semibold text-amber-200">Motsägande signaler i underlaget</div>
            <div className="mt-3"><ClaimList items={draft.contradictions} sources={sourceMap} /></div>
          </div>
        ) : null}
      </Section>

      <Section id="sources" title="Källor" eyebrow="Verifierat underlag">
        <ol className="space-y-3">
          {packet.sources.map((source, index) => (
            <li id={`source-${index + 1}`} key={source.id} className="scroll-mt-24 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
              <div className="flex gap-3">
                <span className="font-semibold text-blue-400">[{index + 1}]</span>
                <div className="min-w-0">
                  <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-slate-200 underline decoration-white/20 underline-offset-4 hover:text-white">
                    {source.publisher}
                  </a>
                  <div className="mt-1 text-xs text-slate-500">
                    {source.kind.replaceAll("_", " ")} · publicerad {date(source.publishedAt)} · verifierad {date(source.verifiedAt)}
                    {source.primary ? " · primärkälla" : ""}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <footer className="mt-10 border-t border-white/10 pt-6 text-xs leading-5 text-slate-500">
        <p>
          DivLab Analys är generell information och utbildningsmaterial, inte personlig investeringsrådgivning. Historisk utveckling och modellscenarier är ingen garanti för framtida avkastning. Gör alltid en egen bedömning av risk och lämplighet.
        </p>
        <p className="mt-2">Analysmotor: {packet.version} · Analyst: analyst-v2 · Research quality {packet.qualityGate.score}/100 · Analyst quality {analysis.analystQualityGate.score}/100.</p>
      </footer>
    </article>
  );
}
