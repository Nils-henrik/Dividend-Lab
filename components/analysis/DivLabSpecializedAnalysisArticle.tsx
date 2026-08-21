import Link from "next/link";
import { DivLabAnalysisChart } from "./DivLabAnalysisChart";
import type { PublishedBankAnalysis, PublishedFinancialSpecialistAnalysis } from "@/lib/analysis/public-read";

type Analysis = PublishedBankAnalysis | PublishedFinancialSpecialistAnalysis;
type Claim = { text: string; sourceIds: readonly string[] };
function finite(value: number | null | undefined): value is number { return typeof value === "number" && Number.isFinite(value); }
function number(value: number | null | undefined, digits = 1): string { if (!finite(value)) return "—"; return new Intl.NumberFormat("sv-SE", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value); }
function money(value: number | null | undefined, currency: string): string { return finite(value) ? `${number(value, value < 100 ? 2 : 1)} ${currency}` : "—"; }
function percentPoints(value: number | null | undefined): string { return finite(value) ? `${number(value, 1)} %` : "—"; }
function date(value: string): string { const parsed = new Date(value); return Number.isFinite(parsed.getTime()) ? new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Stockholm" }).format(parsed) : value; }
function viewLabel(view: "positive" | "neutral" | "negative") { return view === "positive" ? "Positiv" : view === "negative" ? "Negativ" : "Neutral"; }
function riskLabel(value: "low" | "medium" | "high") { return value === "low" ? "Låg" : value === "high" ? "Hög" : "Medel"; }
function DataCell({ label, value }: { label: string; value: string }) { return <div className="border-t border-white/10 py-4 sm:border-t-0 sm:border-l sm:px-5 first:sm:border-l-0 first:sm:pl-0"><div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">{label}</div><div className="mt-2 text-base font-semibold text-slate-100 sm:text-lg">{value}</div></div>; }
function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <section className="border-t border-white/12 pt-8 sm:pt-10"><div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-400">{eyebrow}</div><h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">{title}</h2><div className="mt-6">{children}</div></section>; }
function Claims({ items, sourceMap }: { items: readonly Claim[]; sourceMap: ReadonlyMap<string, number> }) { return <div className="space-y-5">{items.map((item, index) => <p key={`${item.text}-${index}`} className="text-[15px] leading-7 text-slate-300 sm:text-base sm:leading-8">{item.text}{item.sourceIds.map((id) => { const nr = sourceMap.get(id); return nr ? <a key={id} href={`#source-${nr}`} className="ml-1 align-super text-[10px] font-semibold text-blue-400">[{nr}]</a> : null; })}</p>)}</div>; }

export default function DivLabSpecializedAnalysisArticle({ analysis }: { analysis: Analysis }) {
  const packet = analysis.packet;
  const draft = analysis.draft;
  const currency = packet.instrument.currency;
  const sourceMap = new Map(packet.sources.map((source, index) => [source.id, index + 1] as const));
  const support = [...packet.technical.levels.supports].sort((a, b) => Math.abs(a.distancePct) - Math.abs(b.distancePct))[0];
  const resistance = [...packet.technical.levels.resistances].sort((a, b) => Math.abs(a.distancePct) - Math.abs(b.distancePct))[0];
  const scenarios = analysis.kind === "bank" ? analysis.packet.bankScenarios.scenarios : analysis.packet.specialistScenarios.scenarios;
  const base = scenarios.find((scenario) => scenario.name === "base");
  const title = analysis.kind === "bank" ? `${packet.instrument.name}: bankanalys med kapital, kreditrisk och värdering` : analysis.packet.companyClassification.type === "investment_company" ? `${packet.instrument.name}: substansvärdet, rabatten och portföljen i fokus` : `${packet.instrument.name}: AUM, avgiftsintjäning och värdering i fokus`;
  const specialistClaims: readonly Claim[] = analysis.kind === "bank" ? analysis.draft.bankFundamentalInterpretation : analysis.draft.specialistInterpretation;
  const qualityFactors = analysis.kind === "bank"
    ? Object.entries(analysis.draft.bankFactors).map(([key, factor]) => ({ key, label: key, assessment: factor.assessment, rationale: factor.rationale }))
    : analysis.draft.qualityFactors.map((factor, index) => ({ key: `${factor.label}-${index}`, label: factor.label, assessment: factor.assessment, rationale: factor.rationale }));

  return (
    <article className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 sm:pb-28 sm:pt-10 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-slate-600"><Link href="/">Hem</Link><span>/</span><Link href="/analyses">Analyser</Link><span>/</span><span className="truncate text-slate-500">{packet.instrument.name}</span></nav>
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">DivLab Analys · {analysis.kind === "bank" ? "Bankmetodik" : analysis.packet.companyClassification.type === "investment_company" ? "Investmentbolagsmetodik" : "Kapitalförvaltarmetodik"}</div>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">{draft.executiveSummary}</p>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-b border-white/12 pb-6 text-xs text-slate-500"><span>Publicerad {date(analysis.publishedAt)}</span><span>Data t.o.m. {date(packet.dataAsOf)}</span><span>Analyskurs {money(packet.instrument.currentPrice, currency)}</span><span>Version {analysis.versionNumber}</span></div>
      </header>
      <section className="border-b border-white/12 py-6"><div className="grid sm:grid-cols-4"><DataCell label="DivLabs syn" value={viewLabel(draft.view)} /><DataCell label="Risk" value={riskLabel(draft.riskLevel)} /><DataCell label="Tidshorisont" value={`${draft.horizonMonths.min}–${draft.horizonMonths.max} mån`} /><DataCell label="Basscenario" value={money(base?.valuePerShare, currency)} /></div></section>
      <section className="py-9 sm:py-12"><DivLabAnalysisChart model={packet.chart} symbol={packet.instrument.symbol} currency={currency} visibleSessions={160} /></section>
      <section className="border-y border-white/12 py-6"><div className="grid sm:grid-cols-3"><DataCell label="Kortsiktigt stöd" value={support ? `${money(support.lower, currency)}–${money(support.upper, currency)}` : "—"} /><DataCell label="Kortsiktigt motstånd" value={resistance ? `${money(resistance.lower, currency)}–${money(resistance.upper, currency)}` : "—"} /><DataCell label="RSI 14" value={number(packet.technical.snapshot.momentum.rsi14, 1)} /></div></section>

      <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
        <Section eyebrow="Case" title="Vad driver aktien?"><Claims items={draft.investmentCase} sourceMap={sourceMap} /></Section>
        <Section eyebrow="Senaste rapporten" title={analysis.kind === "bank" ? "Bankens fundamentala läge" : "Specialistfundamenta"}>
          {analysis.kind === "bank" ? (
            <div className="mb-7 grid border-y border-white/10 py-5 sm:grid-cols-4"><DataCell label="CET1" value={percentPoints(analysis.packet.bankResearch.reportMetrics.metrics.cet1Ratio.valuePct)} /><DataCell label="ROE" value={percentPoints(analysis.packet.bankResearch.reportMetrics.metrics.returnOnEquity.valuePct)} /><DataCell label="Kreditförlust" value={percentPoints(analysis.packet.bankResearch.reportMetrics.metrics.creditLossRatio.valuePct)} /><DataCell label="P/B" value={number(analysis.packet.bankResearch.valuation.priceToBook, 2)} /></div>
          ) : analysis.packet.companyClassification.type === "investment_company" ? (
            <div className="mb-7 grid border-y border-white/10 py-5 sm:grid-cols-3"><DataCell label="NAV / aktie" value={money(analysis.packet.specialistResearch.metrics.navPerShare.value, currency)} /><DataCell label="Rabatt / premie" value={percentPoints(analysis.packet.specialistResearch.metrics.discountToNavPct.value)} /><DataCell label="Nettoskuld / NAV" value={percentPoints(analysis.packet.specialistResearch.metrics.netDebtRatioPct.value)} /></div>
          ) : (
            <div className="mb-7 grid border-y border-white/10 py-5 sm:grid-cols-4"><DataCell label="Total AUM" value={finite(analysis.packet.specialistResearch.metrics.totalAumEurBn.value) ? `${number(analysis.packet.specialistResearch.metrics.totalAumEurBn.value, 0)} EUR bn` : "—"} /><DataCell label="Fee AUM" value={finite(analysis.packet.specialistResearch.metrics.feeGeneratingAumEurBn.value) ? `${number(analysis.packet.specialistResearch.metrics.feeGeneratingAumEurBn.value, 0)} EUR bn` : "—"} /><DataCell label="Fee AUM-andel" value={percentPoints(analysis.packet.specialistResearch.metrics.feeAumSharePct.value)} /><DataCell label="P/E" value={number(analysis.packet.specialistResearch.metrics.trailingPe.value, 1)} /></div>
          )}
          <Claims items={draft.latestReport} sourceMap={sourceMap} /><div className="mt-7"><Claims items={specialistClaims} sourceMap={sourceMap} /></div>
        </Section>
        <Section eyebrow="Värdering" title={analysis.kind === "bank" ? "P/B, P/E och scenarier" : analysis.packet.companyClassification.type === "investment_company" ? "Substansvärde och rabatt" : "AUM, intjäning och P/E"}>
          <Claims items={draft.valuationInterpretation} sourceMap={sourceMap} />
          <div className="mt-9 border-t border-white/12">{scenarios.map((scenario) => <div key={scenario.name} className="grid gap-4 border-b border-white/10 py-6 md:grid-cols-[150px_180px_1fr]"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{scenario.label}</div><div className="text-2xl font-semibold text-white">{money(scenario.valuePerShare, currency)}</div><div className="space-y-2 text-sm leading-6 text-slate-400">{scenario.assumptions.map((item) => <p key={item}>{item}</p>)}</div></div>)}</div>
        </Section>
        <Section eyebrow="Risk" title="Vad kan gå fel?"><Claims items={draft.risks} sourceMap={sourceMap} /><div className="mt-8 border-l border-red-400/60 pl-5"><Claims items={draft.thesisBreakers} sourceMap={sourceMap} /></div></Section>
        <Section eyebrow="Slutsats" title="DivLabs sammanvägda bild"><p className="text-lg leading-8 text-slate-200 sm:text-xl sm:leading-9">{draft.executiveSummary}</p><div className="mt-7 grid border-y border-white/10 py-5 sm:grid-cols-4"><DataCell label="Syn" value={viewLabel(draft.view)} /><DataCell label="Risk" value={riskLabel(draft.riskLevel)} /><DataCell label="Research" value={`${packet.qualityGate.score}/100`} /><DataCell label="Analyst" value={`${analysis.analystQualityGate.score}/100`} /></div></Section>
        <section id="sources" className="border-t border-white/12 pt-8">
          <details className="border-y border-white/10 py-5"><summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.15em] text-slate-300">Analysdata, specialistfaktorer och metod +</summary><div className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2">{qualityFactors.map((factor) => <div key={factor.key} className="border-t border-white/10 pt-4"><div className="text-sm font-semibold text-slate-200">{factor.label}</div><div className="mt-1 text-xs uppercase text-slate-500">{factor.assessment}</div><p className="mt-2 text-sm leading-6 text-slate-500">{factor.rationale}</p></div>)}</div></details>
          <div className="mt-9"><div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">Verifierade källor</div><ol className="mt-6 border-t border-white/10">{packet.sources.map((source, index) => <li id={`source-${index + 1}`} key={source.id} className="border-b border-white/10 py-4 text-sm text-slate-400"><a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-slate-200 underline decoration-white/20 underline-offset-4">[{index + 1}] {source.publisher}</a></li>)}</ol></div>
        </section>
      </div>
      <footer className="mt-12 border-t border-white/12 pt-6 text-xs leading-6 text-slate-600">DivLab Analys är generell information och utbildningsmaterial, inte personlig investeringsrådgivning.</footer>
    </article>
  );
}
