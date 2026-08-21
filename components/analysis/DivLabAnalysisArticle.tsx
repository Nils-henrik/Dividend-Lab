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

function compactMoney(value: number | null | undefined, currency: string): string {
  if (!finite(value)) return "—";
  return `${number(value, 0)} ${currency}`;
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

function viewLabel(view: "positive" | "neutral" | "negative") {
  return view === "positive" ? "Positiv" : view === "negative" ? "Negativ" : "Neutral";
}

function viewClass(view: "positive" | "neutral" | "negative") {
  return view === "positive"
    ? "text-emerald-300"
    : view === "negative"
      ? "text-red-300"
      : "text-slate-200";
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

function CitationMarks({
  sourceIds,
  sources,
}: {
  sourceIds: readonly string[];
  sources: ReadonlyMap<string, number>;
}) {
  return (
    <>
      {sourceIds.map((sourceId) => {
        const sourceNumber = sources.get(sourceId);
        return sourceNumber ? (
          <a
            key={sourceId}
            href={`#source-${sourceNumber}`}
            className="ml-1 align-super text-[10px] font-semibold text-blue-400 hover:text-blue-300"
          >
            [{sourceNumber}]
          </a>
        ) : null;
      })}
    </>
  );
}

function ClaimParagraphs({
  items,
  sources,
  className = "",
}: {
  items: readonly DivLabAnalystClaim[];
  sources: ReadonlyMap<string, number>;
  className?: string;
}) {
  return (
    <div className={`space-y-5 ${className}`}>
      {items.map((item, index) => (
        <p key={`${item.text}-${index}`} className="text-[15px] leading-7 text-slate-300 sm:text-base sm:leading-8">
          {item.text}
          <CitationMarks sourceIds={item.sourceIds} sources={sources} />
        </p>
      ))}
    </div>
  );
}

function EditorialSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/12 pt-8 sm:pt-10">
      {eyebrow ? (
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-400">{eyebrow}</div>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function DataCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-t border-white/10 py-4 sm:border-t-0 sm:border-l sm:px-5 sm:py-0 first:sm:border-l-0 first:sm:pl-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-slate-100 sm:text-lg">{value}</div>
      {hint ? <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  );
}

function factorLabel(key: string): string {
  return ({
    competitiveAdvantage: "Konkurrensfördel",
    pricingPower: "Prissättningskraft",
    marketPosition: "Marknadsposition",
    managementAndCapitalAllocation: "Ledning & kapitalallokering",
    reinvestmentRunway: "Återinvesteringsmöjlighet",
    cyclicality: "Konjunkturkänslighet",
    customerConcentration: "Kundkoncentration",
    regulatoryRisk: "Regulatorisk risk",
    currencyRisk: "Valutarisk",
    acquisitionRisk: "Förvärvsrisk",
    disruptionRisk: "Disruptionsrisk",
  } as Record<string, string>)[key] ?? key;
}

function assessmentLabel(value: "strong" | "neutral" | "weak" | "unknown") {
  return value === "strong" ? "Stark" : value === "weak" ? "Svag" : value === "neutral" ? "Neutral" : "Okänd";
}

function editorialHeadline(input: {
  name: string;
  currency: string;
  view: "positive" | "neutral" | "negative";
  supportCenter?: number | null;
  resistanceCenter?: number | null;
}): string {
  if (finite(input.resistanceCenter)) {
    return `${input.name} närmar sig motstånd vid ${compactMoney(input.resistanceCenter, input.currency)} – här avgörs nästa rörelse`;
  }
  if (finite(input.supportCenter)) {
    return `${input.name} testar viktigt stöd kring ${compactMoney(input.supportCenter, input.currency)} – nästa rörelse i fokus`;
  }
  if (input.view === "positive") return `${input.name} stärker den tekniska bilden – men värderingen sätter ribban`;
  if (input.view === "negative") return `${input.name} under press – nivåerna som avgör om svagheten fortsätter`;
  return `${input.name}: tekniken, värderingen och caset just nu`;
}

export default function DivLabAnalysisArticle({ analysis }: { analysis: PublishedDivLabAnalysis }) {
  const { packet, draft } = analysis;
  const currency = packet.instrument.currency;
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
  const headline = editorialHeadline({
    name: packet.instrument.name,
    currency,
    view: draft.view,
    supportCenter: nearestSupport?.center,
    resistanceCenter: nearestResistance?.center,
  });

  const lead = nearestResistance
    ? `${packet.instrument.name} handlas kring ${money(packet.instrument.currentPrice, currency)} och står nära ett tekniskt motståndsområde på ${money(nearestResistance.lower, currency)}–${money(nearestResistance.upper, currency)}. DivLabs sammanvägda syn är ${viewLabel(draft.view).toLowerCase()} med ${riskLabel(draft.riskLevel).toLowerCase()} risk.`
    : nearestSupport
      ? `${packet.instrument.name} handlas kring ${money(packet.instrument.currentPrice, currency)} med närmaste verifierade stöd på ${money(nearestSupport.lower, currency)}–${money(nearestSupport.upper, currency)}. DivLabs sammanvägda syn är ${viewLabel(draft.view).toLowerCase()} med ${riskLabel(draft.riskLevel).toLowerCase()} risk.`
      : `${packet.instrument.name} handlas kring ${money(packet.instrument.currentPrice, currency)}. DivLabs sammanvägda syn är ${viewLabel(draft.view).toLowerCase()} med ${riskLabel(draft.riskLevel).toLowerCase()} risk och en analys­horisont på ${draft.horizonMonths.min}–${draft.horizonMonths.max} månader.`;

  return (
    <article className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 sm:pb-28 sm:pt-10 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-slate-600" aria-label="Brödsmulor">
        <Link href="/" className="hover:text-slate-300">Hem</Link>
        <span>/</span>
        <Link href="/analyses" className="hover:text-slate-300">Analyser</Link>
        <span>/</span>
        <span className="truncate text-slate-500">{packet.instrument.name}</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <span className="text-blue-400">DivLab Analys</span>
          <span className="text-slate-700">/</span>
          <span className={viewClass(draft.view)}>{viewLabel(draft.view)} syn</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-500">{packet.instrument.symbol}.{packet.instrument.exchange}</span>
        </div>

        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl">
          {headline}
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
          {lead}
        </p>

        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-b border-white/12 pb-6 text-xs text-slate-500">
          <span>Publicerad {date(analysis.publishedAt)}</span>
          <span>Data t.o.m. {date(packet.dataAsOf)}</span>
          <span>Analyskurs {money(packet.instrument.currentPrice, currency)}</span>
          <span>Version {analysis.versionNumber}</span>
        </div>
      </header>

      <section className="border-b border-white/12 py-6">
        <div className="grid sm:grid-cols-3">
          <DataCell label="DivLabs syn" value={viewLabel(draft.view)} />
          <DataCell label="Risk" value={riskLabel(draft.riskLevel)} />
          <DataCell label="Tidshorisont" value={`${draft.horizonMonths.min}–${draft.horizonMonths.max} mån`} hint={`Confidence: ${confidenceLabel(draft.confidence)}`} />
        </div>
      </section>

      <section className="py-9 sm:py-12">
        <div className="border-l-2 border-blue-400 pl-5 sm:pl-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">Tes just nu</div>
          <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-200 sm:text-xl sm:leading-9">
            {draft.executiveSummary}
          </p>
        </div>
      </section>

      <DivLabAnalysisChart
        model={packet.chart}
        symbol={packet.instrument.symbol}
        currency={currency}
        visibleSessions={160}
      />

      <section className="border-b border-white/12 py-7">
        <div className="grid gap-0 sm:grid-cols-4">
          <DataCell label="Trend" value={regimeLabel(technical.trend.regime)} />
          <DataCell label="RSI 14" value={number(technical.momentum.rsi14, 1)} />
          <DataCell
            label="Närmaste stöd"
            value={nearestSupport ? `${money(nearestSupport.lower, currency)}–${money(nearestSupport.upper, currency)}` : "—"}
            hint={nearestSupport ? `${nearestSupport.touches} historiska test` : undefined}
          />
          <DataCell
            label="Närmaste motstånd"
            value={nearestResistance ? `${money(nearestResistance.lower, currency)}–${money(nearestResistance.upper, currency)}` : "—"}
            hint={nearestResistance ? `${nearestResistance.touches} historiska test` : undefined}
          />
        </div>
      </section>

      <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
        <EditorialSection eyebrow="Prisbilden" title="Det tekniska läget">
          <ClaimParagraphs items={draft.technicalInterpretation} sources={sourceMap} />
          <div className="mt-7 grid border-y border-white/10 py-5 sm:grid-cols-3">
            <DataCell label="Kurs vs MA50" value={percent(technical.trend.priceVsSma50Pct)} />
            <DataCell label="Kurs vs MA200" value={percent(technical.trend.priceVsSma200Pct)} />
            <DataCell label="Volym vs 20 dagar" value={finite(technical.volume.volumeRatio20) ? `${number(technical.volume.volumeRatio20, 2)}×` : "—"} />
          </div>
        </EditorialSection>

        <EditorialSection eyebrow="Bolaget" title="Vad talar för caset?">
          <ClaimParagraphs items={draft.investmentCase} sources={sourceMap} />
          <div className="mt-8 border-l border-emerald-400/60 pl-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Katalysatorer</div>
            <div className="mt-4">
              <ClaimParagraphs items={draft.catalysts} sources={sourceMap} />
            </div>
          </div>
        </EditorialSection>

        <EditorialSection eyebrow="Senaste rapporten" title="Det fundamentala läget">
          <div className="grid border-y border-white/10 py-5 sm:grid-cols-4">
            <DataCell label="Fundamental score" value={finite(packet.fundamental.scorecard.overall) ? `${number(packet.fundamental.scorecard.overall, 1)}/10` : "—"} />
            <DataCell label="Omsättning YoY" value={percent(packet.fundamental.metrics.revenueGrowthYoy)} />
            <DataCell label="Rörelsemarginal" value={plainPercent(packet.fundamental.metrics.operatingMarginTtm)} />
            <DataCell label="ROIC" value={plainPercent(packet.fundamental.metrics.returnOnInvestedCapital)} />
          </div>
          <div className="mt-7">
            <ClaimParagraphs items={draft.latestReport} sources={sourceMap} />
          </div>
          <div className="mt-7">
            <ClaimParagraphs items={draft.fundamentalInterpretation} sources={sourceMap} />
          </div>
        </EditorialSection>

        <EditorialSection eyebrow="Värdering" title="Vad betalar marknaden?">
          <div className="grid border-y border-white/10 py-5 sm:grid-cols-4">
            <DataCell label="P/E" value={number(trailing.pe, 1)} />
            <DataCell label="P/FCF" value={number(trailing.priceToFcf, 1)} />
            <DataCell label="FCF yield" value={plainPercent(trailing.fcfYield)} />
            <DataCell label="EV/EBITDA" value={number(trailing.evToEbitda, 1)} />
          </div>

          <div className="mt-7 space-y-5">
            {draft.valuationInterpretation.map((claim, index) => (
              <p key={`${claim.measure}-${index}`} className="text-[15px] leading-7 text-slate-300 sm:text-base sm:leading-8">
                {claim.text}
                <CitationMarks sourceIds={claim.sourceIds} sources={sourceMap} />
              </p>
            ))}
          </div>

          <div className="mt-9 border-t border-white/12">
            {packet.valuation.scenarios.map((scenario) => {
              const labelClass = scenario.name === "bull"
                ? "text-emerald-300"
                : scenario.name === "bear"
                  ? "text-red-300"
                  : "text-blue-300";
              return (
                <div key={scenario.name} className="grid gap-4 border-b border-white/10 py-6 md:grid-cols-[150px_180px_1fr] md:items-start">
                  <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${labelClass}`}>{scenario.label}</div>
                  <div>
                    <div className="text-2xl font-semibold text-white">{money(scenario.valuePerShare, currency)}</div>
                    <div className={finite(scenario.upsideDownsidePct) && scenario.upsideDownsidePct >= 0 ? "mt-1 text-sm text-emerald-300" : "mt-1 text-sm text-red-300"}>
                      {percent(scenario.upsideDownsidePct)} mot analyskurs
                    </div>
                  </div>
                  <div className="space-y-2 text-sm leading-6 text-slate-400">
                    {scenario.assumptions.map((assumption) => <p key={assumption}>{assumption}</p>)}
                  </div>
                </div>
              );
            })}
          </div>
        </EditorialSection>

        <EditorialSection eyebrow="Risk" title="Vad kan gå fel?">
          <ClaimParagraphs items={draft.risks} sources={sourceMap} />
          <div className="mt-8 border-l border-red-400/60 pl-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300">Vad skulle ändra vår syn?</div>
            <div className="mt-4">
              <ClaimParagraphs items={draft.thesisBreakers} sources={sourceMap} />
            </div>
          </div>
          {draft.contradictions.length ? (
            <div className="mt-8 border-t border-amber-400/30 pt-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Motsägande signaler</div>
              <div className="mt-4">
                <ClaimParagraphs items={draft.contradictions} sources={sourceMap} />
              </div>
            </div>
          ) : null}
        </EditorialSection>

        <EditorialSection eyebrow="Slutsats" title="DivLabs sammanvägda bild">
          <p className="text-lg leading-8 text-slate-200 sm:text-xl sm:leading-9">{draft.executiveSummary}</p>
          <div className="mt-7 grid border-y border-white/10 py-5 sm:grid-cols-4">
            <DataCell label="Syn" value={viewLabel(draft.view)} />
            <DataCell label="Risk" value={riskLabel(draft.riskLevel)} />
            <DataCell label="Research" value={`${packet.qualityGate.score}/100`} />
            <DataCell label="Analyst" value={`${analysis.analystQualityGate.score}/100`} />
          </div>
          {baseScenario && finite(baseScenario.valuePerShare) ? (
            <p className="mt-6 text-sm leading-7 text-slate-400">
              Deterministiskt basscenario: <span className="font-semibold text-slate-200">{money(baseScenario.valuePerShare, currency)}</span>
              {finite(baseScenario.upsideDownsidePct) ? ` (${percent(baseScenario.upsideDownsidePct)} mot analyskurs).` : "."}
            </p>
          ) : null}
        </EditorialSection>

        <section id="sources" className="scroll-mt-24 border-t border-white/12 pt-8 sm:pt-10">
          <details className="group border-y border-white/10 py-5">
            <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.15em] text-slate-300 marker:hidden">
              Analysdata, kvalitetsfaktorer och metod <span className="ml-2 text-slate-600 group-open:hidden">+</span><span className="ml-2 hidden text-slate-600 group-open:inline">−</span>
            </summary>
            <div className="mt-7 space-y-8">
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                {Object.entries(draft.qualityFactors).map(([key, factor]) => (
                  <div key={key} className="border-t border-white/10 pt-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="text-sm font-semibold text-slate-200">{factorLabel(key)}</div>
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{assessmentLabel(factor.assessment)}</div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{factor.rationale}<CitationMarks sourceIds={factor.sourceIds} sources={sourceMap} /></p>
                  </div>
                ))}
              </div>
              <div className="text-xs leading-6 text-slate-500">
                Analysmotor: {packet.version} · Analyst: analyst-v2 · Research quality {packet.qualityGate.score}/100 · Analyst quality {analysis.analystQualityGate.score}/100.
              </div>
            </div>
          </details>

          <div className="mt-9">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">Verifierade källor</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">Källor</h2>
            <ol className="mt-6 border-t border-white/10">
              {packet.sources.map((source, index) => (
                <li id={`source-${index + 1}`} key={source.id} className="scroll-mt-24 border-b border-white/10 py-4 text-sm text-slate-400">
                  <div className="flex gap-4">
                    <span className="w-7 shrink-0 font-semibold text-blue-400">[{index + 1}]</span>
                    <div className="min-w-0">
                      <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-slate-200 underline decoration-white/20 underline-offset-4 hover:text-white">
                        {source.publisher}
                      </a>
                      <div className="mt-1 text-xs text-slate-600">
                        {source.kind.replaceAll("_", " ")} · publicerad {date(source.publishedAt)} · verifierad {date(source.verifiedAt)}{source.primary ? " · primärkälla" : ""}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      <footer className="mt-12 border-t border-white/12 pt-6 text-xs leading-6 text-slate-600">
        DivLab Analys är generell information och utbildningsmaterial, inte personlig investeringsrådgivning. Historisk utveckling och modellscenarier är ingen garanti för framtida avkastning. Gör alltid en egen bedömning av risk och lämplighet.
      </footer>
    </article>
  );
}
