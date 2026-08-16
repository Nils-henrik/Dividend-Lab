import { ImageResponse } from "next/og";
import { analysisBaseValue, getPublishedDivLabAnalysis } from "@/lib/analysis/public-read";

export const alt = "DivLab aktieanalys";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 300;

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function price(value: number | null | undefined, currency: string): string {
  if (!finite(value)) return "—";
  return `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: value < 100 ? 2 : 1 }).format(value)} ${currency}`;
}
function percent(value: number | null | undefined): string {
  if (!finite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(value * 100)} %`;
}
function viewLabel(view: "positive" | "neutral" | "negative") {
  return view === "positive" ? "POSITIV" : view === "negative" ? "NEGATIV" : "NEUTRAL";
}
function miniChart(input: {
  bars: readonly { close: number; adjustedClose: number | null }[];
  support?: { lower: number; upper: number };
  resistance?: { lower: number; upper: number };
}) {
  const bars = input.bars.slice(-90);
  const closes = bars.map((bar) => bar.close);
  const extras = [input.support?.lower, input.support?.upper, input.resistance?.lower, input.resistance?.upper].filter((value): value is number => finite(value));
  const min = Math.min(...closes, ...extras);
  const max = Math.max(...closes, ...extras);
  const spread = Math.max(max - min, Math.max(max, 1) * 0.03);
  const lo = min - spread * 0.08;
  const hi = max + spread * 0.08;
  const width = 650;
  const height = 250;
  const x = (index: number) => (index / Math.max(1, closes.length - 1)) * width;
  const y = (value: number) => ((hi - value) / (hi - lo)) * height;
  const points = closes.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const zone = (value?: { lower: number; upper: number }) => value ? { y: y(value.upper), height: Math.max(3, y(value.lower) - y(value.upper)) } : null;
  return { points, support: zone(input.support), resistance: zone(input.resistance), width, height };
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const analysis = await getPublishedDivLabAnalysis(slug);
  if (!analysis) {
    return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#080b10", color: "#f8fafc", fontSize: 54, fontWeight: 700 }}>DivLab Analys</div>, size);
  }
  const { packet, draft } = analysis;
  const support = [...packet.chart.zones.supports].sort((a, b) => Math.abs(a.distancePct) - Math.abs(b.distancePct))[0];
  const resistance = [...packet.chart.zones.resistances].sort((a, b) => Math.abs(a.distancePct) - Math.abs(b.distancePct))[0];
  const baseValue = analysisBaseValue(analysis);
  const baseUpside = baseValue === null ? null : baseValue / packet.instrument.currentPrice - 1;
  const chart = miniChart({ bars: packet.chart.bars, support, resistance });
  const viewColor = draft.view === "positive" ? "#34d399" : draft.view === "negative" ? "#f87171" : "#cbd5e1";
  const methodology = analysis.kind === "bank" ? "BANK" : analysis.kind === "financial_specialist" ? (packet.companyClassification.type === "investment_company" ? "INVESTMENTBOLAG" : "KAPITALFÖRVALTARE") : "BOLAG";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#080b10", color: "#f8fafc", padding: "52px 58px 44px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 48, height: 48, background: "#0a84ff", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>DL</div>
          <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 22, fontWeight: 700 }}>DivLab Analys</div><div style={{ fontSize: 14, color: "#64748b", marginTop: 3 }}>{methodology} · fundamental + teknisk analys</div></div>
        </div>
        <div style={{ display: "flex", border: `1px solid ${viewColor}55`, color: viewColor, padding: "10px 18px", fontWeight: 800, fontSize: 15, letterSpacing: 1.4 }}>{viewLabel(draft.view)} SYN</div>
      </div>
      <div style={{ display: "flex", flex: 1, marginTop: 38, gap: 42 }}>
        <div style={{ display: "flex", width: 410, flexDirection: "column" }}>
          <div style={{ fontSize: 18, color: "#60a5fa", fontWeight: 700, letterSpacing: 1.2 }}>{packet.instrument.symbol}.{packet.instrument.exchange}</div>
          <div style={{ fontSize: 46, lineHeight: 1.04, fontWeight: 780, letterSpacing: -1.8, marginTop: 11 }}>{packet.instrument.name}</div>
          <div style={{ display: "flex", gap: 24, marginTop: 28 }}>
            <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 13, color: "#64748b" }}>ANALYSKURS</div><div style={{ fontSize: 25, fontWeight: 700, marginTop: 6 }}>{price(packet.instrument.currentPrice, packet.instrument.currency)}</div></div>
            <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 13, color: "#64748b" }}>BASSCENARIO</div><div style={{ fontSize: 25, fontWeight: 700, marginTop: 6 }}>{price(baseValue, packet.instrument.currency)}</div><div style={{ fontSize: 14, color: finite(baseUpside) && baseUpside >= 0 ? "#34d399" : "#f87171", marginTop: 2 }}>{percent(baseUpside)}</div></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, borderTop: "1px solid #1e293b", paddingTop: 20, gap: 8, fontSize: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Stöd</span><span style={{ color: "#86efac", fontWeight: 700 }}>{support ? `${price(support.lower, packet.instrument.currency)}–${price(support.upper, packet.instrument.currency)}` : "—"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Motstånd</span><span style={{ color: "#fca5a5", fontWeight: 700 }}>{resistance ? `${price(resistance.lower, packet.instrument.currency)}–${price(resistance.upper, packet.instrument.currency)}` : "—"}</span></div>
          </div>
        </div>
        <div style={{ display: "flex", width: 650, height: 330, flexDirection: "column", marginTop: 5 }}>
          <div style={{ display: "flex", fontSize: 13, color: "#64748b", marginBottom: 12 }}>AI-MARKERADE PRISOMRÅDEN · SENASTE 90 HANDELSDAGAR</div>
          <svg width="650" height="250" viewBox={`0 0 ${chart.width} ${chart.height}`}>
            {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="0" x2="650" y1={i * 62.5} y2={i * 62.5} stroke="#172033" strokeWidth="1" />)}
            {chart.support ? <rect x="0" y={chart.support.y} width="650" height={chart.support.height} fill="#22c55e" opacity="0.14" /> : null}
            {chart.resistance ? <rect x="0" y={chart.resistance.y} width="650" height={chart.resistance.height} fill="#ef4444" opacity="0.14" /> : null}
            <polyline points={chart.points} fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 13, color: "#64748b" }}><span>Analysdata fryst vid publicering</span><span>divlab.se</span></div>
        </div>
      </div>
    </div>, size,
  );
}
