"use client";

import { useMemo } from "react";
import {
  useAnalysisClient,
  type AnalysisClientClaim,
  type AnalysisClientLevel,
} from "./AnalysisClientContext";

type View = "positive" | "neutral" | "negative";

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

function money(value: number | null | undefined, currency: string): string {
  if (!finite(value)) return "—";
  return `${number(value, value < 100 ? 2 : 1)} ${currency}`;
}

function percent(value: number | null | undefined): string {
  if (!finite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${number(value * 100, 1)} %`;
}

function viewLabel(view: View): string {
  return view === "positive" ? "Positiv" : view === "negative" ? "Negativ" : "Neutral";
}

function riskLabel(value: "low" | "medium" | "high"): string {
  return value === "low" ? "Låg" : value === "high" ? "Hög" : "Medel";
}

function nearest(levels: readonly AnalysisClientLevel[]): AnalysisClientLevel | null {
  return [...levels].sort((a, b) => Math.abs(a.distancePct) - Math.abs(b.distancePct))[0] ?? null;
}

function swingView(input: {
  regime: string;
  rsi14: number | null;
  priceVsSma50Pct: number | null;
}): View {
  let score = 0;
  if (input.regime === "strong_uptrend") score += 3;
  else if (input.regime === "uptrend") score += 2;
  else if (input.regime === "downtrend") score -= 2;
  else if (input.regime === "strong_downtrend") score -= 3;

  if (finite(input.priceVsSma50Pct)) score += input.priceVsSma50Pct >= 0 ? 1 : -1;
  if (finite(input.rsi14)) {
    if (input.rsi14 >= 52 && input.rsi14 <= 68) score += 1;
    else if (input.rsi14 < 42) score -= 1;
    else if (input.rsi14 >= 72) score -= 1;
  }

  if (score >= 2) return "positive";
  if (score <= -2) return "negative";
  return "neutral";
}

function CitationMarks({
  claim,
  sourceMap,
}: {
  claim: AnalysisClientClaim;
  sourceMap: ReadonlyMap<string, number>;
}) {
  return (
    <>
      {claim.sourceIds.map((sourceId) => {
        const sourceNumber = sourceMap.get(sourceId);
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 py-4 sm:border-t-0 sm:border-l sm:px-5 first:sm:border-l-0 first:sm:pl-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-slate-100">{value}</div>
    </div>
  );
}

export function AnalysisHorizons() {
  const analysis = useAnalysisClient();

  const derived = useMemo(() => {
    if (!analysis) return null;
    const support = nearest(analysis.technical.supports);
    const resistance = nearest(analysis.technical.resistances);
    const swing = swingView({
      regime: analysis.technical.trendRegime,
      rsi14: analysis.technical.rsi14,
      priceVsSma50Pct: analysis.technical.priceVsSma50Pct,
    });
    return { support, resistance, swing };
  }, [analysis]);

  if (!analysis || !derived) return null;

  const { support, resistance, swing } = derived;
  const sourceMap = new Map(analysis.sources.map((source) => [source.id, source.number] as const));
  const currency = analysis.instrument.currency;

  const swingTrigger = resistance
    ? `Etablering över ${money(resistance.upper, currency)}`
    : swing === "positive"
      ? "Fortsatta högre toppar och bottnar"
      : "Invänta ny verifierad trigger";
  const swingRisk = support
    ? `Försvagas under ${money(support.lower, currency)}`
    : "Ingen robust stödzon nära kursen";
  const volumeText = finite(analysis.technical.volumeRatio20)
    ? `${number(analysis.technical.volumeRatio20, 2)}× 20-dagarssnittet`
    : "—";

  const swingNarrative = support && resistance
    ? `På 1–4 veckor är DivLabs tekniska swingbild ${viewLabel(swing).toLowerCase()}. Aktien handlas mellan ett verifierat stöd på ${money(support.lower, currency)}–${money(support.upper, currency)} och närmaste motstånd på ${money(resistance.lower, currency)}–${money(resistance.upper, currency)}. Ett tydligt utbrott ovanför motståndet förbättrar kortsiktsbilden, medan en etablering under stödet försämrar risk/reward-profilen.`
    : support
      ? `På 1–4 veckor är swingbilden ${viewLabel(swing).toLowerCase()}. Närmaste verifierade stöd ligger på ${money(support.lower, currency)}–${money(support.upper, currency)}. Utan ett tydligt motstånd ovanför kursen blir trend, volym och nya högre bottnar viktigare än en enskild prisnivå.`
      : `På 1–4 veckor är swingbilden ${viewLabel(swing).toLowerCase()}. Modellen saknar just nu en tillräckligt robust närliggande stödzon, vilket gör kortsiktscaset mer känsligt för momentum- och volymförändringar.`;

  const quarterLead = finite(analysis.fundamentalScore)
    ? `På ungefär ett kvartals sikt är DivLabs sammanvägda bild ${viewLabel(analysis.view).toLowerCase()}. Den fundamentala modellen ligger på ${number(analysis.fundamentalScore, 1)}/10 och väger bolagskvalitet, rapportutveckling, värdering och kommande katalysatorer tyngre än enskilda dagsrörelser.`
    : `På ungefär ett kvartals sikt är DivLabs sammanvägda bild ${viewLabel(analysis.view).toLowerCase()}. Här väger rapportutveckling, värdering, katalysatorer och risker tyngre än den kortsiktiga prisrörelsen.`;

  const quarterClaims = [
    ...analysis.investmentCase.slice(0, 2),
    ...analysis.fundamentalInterpretation.slice(0, 1),
    ...analysis.valuationInterpretation.slice(0, 1),
  ];

  return (
    <section className="border-b border-white/12">
      <div className="grid lg:grid-cols-2">
        <div className="border-t border-white/12 py-8 lg:border-r lg:pr-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-400">Swingtrade · 1–4 veckor</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white">Kortsiktig teknisk analys</h2>
          <p className="mt-5 text-[15px] leading-7 text-slate-300 sm:text-base sm:leading-8">{swingNarrative}</p>

          <div className="mt-7 grid border-y border-white/10 sm:grid-cols-3">
            <Metric label="Swingbild" value={viewLabel(swing)} />
            <Metric label="Trigger" value={swingTrigger} />
            <Metric label="Risknivå" value={swingRisk} />
          </div>

          <div className="mt-5 grid gap-x-5 gap-y-3 text-sm text-slate-500 sm:grid-cols-3">
            <div><span className="text-slate-600">RSI 14</span><div className="mt-1 text-slate-300">{number(analysis.technical.rsi14, 1)}</div></div>
            <div><span className="text-slate-600">Kurs vs MA50</span><div className="mt-1 text-slate-300">{percent(analysis.technical.priceVsSma50Pct)}</div></div>
            <div><span className="text-slate-600">Volym</span><div className="mt-1 text-slate-300">{volumeText}</div></div>
          </div>
        </div>

        <div className="border-t border-white/12 py-8 lg:pl-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-400">Kvartalscase · cirka 3 månader</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white">Längre analys</h2>
          <p className="mt-5 text-[15px] leading-7 text-slate-300 sm:text-base sm:leading-8">{quarterLead}</p>

          <div className="mt-7 grid border-y border-white/10 sm:grid-cols-3">
            <Metric label="Kvartalsbild" value={viewLabel(analysis.view)} />
            <Metric label="Risk" value={riskLabel(analysis.riskLevel)} />
            <Metric
              label="Basscenario"
              value={analysis.baseScenario ? money(analysis.baseScenario.valuePerShare, currency) : "—"}
            />
          </div>

          <div className="mt-6 space-y-4">
            {quarterClaims.map((claim, index) => (
              <p key={`${claim.text}-${index}`} className="text-sm leading-7 text-slate-400">
                {claim.text}
                <CitationMarks claim={claim} sourceMap={sourceMap} />
              </p>
            ))}
          </div>

          {(analysis.catalysts[0] || analysis.risks[0]) ? (
            <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2">
              {analysis.catalysts[0] ? (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-emerald-300">Katalysator</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {analysis.catalysts[0].text}
                    <CitationMarks claim={analysis.catalysts[0]} sourceMap={sourceMap} />
                  </p>
                </div>
              ) : null}
              {analysis.risks[0] ? (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-red-300">Huvudrisk</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {analysis.risks[0].text}
                    <CitationMarks claim={analysis.risks[0]} sourceMap={sourceMap} />
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
