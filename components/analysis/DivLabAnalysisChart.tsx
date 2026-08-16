import type {
  DivLabAnalysisChartModel,
  DivLabAnalysisChartPoint,
  DivLabAnalysisChartZone,
} from "@/lib/analysis/chart-model";

const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 640;
const PLOT_LEFT = 24;
const PLOT_RIGHT = 1092;
const PRICE_TOP = 58;
const PRICE_BOTTOM = 458;
const VOLUME_TOP = 490;
const VOLUME_BOTTOM = 570;
const AXIS_LABEL_X = 1110;

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function safeVisibleSessions(value: number | undefined): number {
  if (!finite(value)) return 140;
  return Math.max(30, Math.min(260, Math.trunc(value)));
}

function priceLabel(value: number): string {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: value < 100 ? 2 : 1,
    maximumFractionDigits: value < 100 ? 2 : 1,
  }).format(value);
}

function compactVolume(value: number): string {
  return new Intl.NumberFormat("sv-SE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function dateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("sv-SE", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function zoneStyle(zone: DivLabAnalysisChartZone): {
  fill: string;
  stroke: string;
  text: string;
} {
  if (zone.kind === "support") {
    return {
      fill: "rgba(34,197,94,0.10)",
      stroke: "rgba(34,197,94,0.62)",
      text: "#86efac",
    };
  }
  return {
    fill: "rgba(239,68,68,0.10)",
    stroke: "rgba(239,68,68,0.62)",
    text: "#fca5a5",
  };
}

function pathForSeries(input: {
  series: readonly DivLabAnalysisChartPoint[];
  dateIndex: ReadonlyMap<string, number>;
  xForIndex: (index: number) => number;
  yForPrice: (price: number) => number;
}): string {
  const points = input.series
    .map((point) => {
      const index = input.dateIndex.get(point.date);
      if (index === undefined) return null;
      return `${input.xForIndex(index)},${input.yForPrice(point.value)}`;
    })
    .filter((value): value is string => value !== null);

  if (!points.length) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point}`).join(" ");
}

function zoneLabel(zone: DivLabAnalysisChartZone): string {
  const prefix = zone.kind === "support" ? "STÖD" : "MOTSTÅND";
  if (Math.abs(zone.upper - zone.lower) < 0.005) {
    return `${prefix} ${priceLabel(zone.center)}`;
  }
  return `${prefix} ${priceLabel(zone.lower)}–${priceLabel(zone.upper)}`;
}

export function DivLabAnalysisChart({
  model,
  symbol,
  currency,
  visibleSessions: requestedVisibleSessions,
  className = "",
}: {
  model: DivLabAnalysisChartModel;
  symbol?: string;
  currency?: string;
  visibleSessions?: number;
  className?: string;
}) {
  const visibleSessions = safeVisibleSessions(requestedVisibleSessions);
  const bars = model.bars.slice(-visibleSessions);

  if (bars.length < 2) {
    return (
      <div className={`border-y border-white/10 bg-[#090d12] px-0 py-8 text-sm text-slate-500 ${className}`}>
        För lite verifierad prisdata för att rita analysgrafen.
      </div>
    );
  }

  const visibleDateSet = new Set(bars.map((bar) => bar.date));
  const visibleSeries = (series: readonly DivLabAnalysisChartPoint[]) =>
    series.filter((point) => visibleDateSet.has(point.date));

  const zonePrices = [
    ...model.zones.supports.flatMap((zone) => [zone.lower, zone.upper]),
    ...model.zones.resistances.flatMap((zone) => [zone.lower, zone.upper]),
  ];
  const rawMin = Math.min(
    ...bars.map((bar) => bar.low),
    ...zonePrices,
    ...(finite(model.currentPrice) ? [model.currentPrice] : []),
  );
  const rawMax = Math.max(
    ...bars.map((bar) => bar.high),
    ...zonePrices,
    ...(finite(model.currentPrice) ? [model.currentPrice] : []),
  );
  const spread = Math.max(rawMax - rawMin, Math.max(rawMax, 1) * 0.02);
  const priceMin = Math.max(0, rawMin - spread * 0.08);
  const priceMax = rawMax + spread * 0.08;
  const xStep = (PLOT_RIGHT - PLOT_LEFT) / bars.length;
  const candleWidth = Math.max(2.2, Math.min(8, xStep * 0.62));
  const xForIndex = (index: number) => PLOT_LEFT + xStep * (index + 0.5);
  const yForPrice = (price: number) =>
    PRICE_TOP + ((priceMax - price) / (priceMax - priceMin)) * (PRICE_BOTTOM - PRICE_TOP);
  const maxVolume = Math.max(...bars.map((bar) => bar.volume), 1);
  const yForVolume = (volume: number) =>
    VOLUME_BOTTOM - (volume / maxVolume) * (VOLUME_BOTTOM - VOLUME_TOP);
  const dateIndex = new Map(bars.map((bar, index) => [bar.date, index] as const));

  const sma20 = pathForSeries({
    series: visibleSeries(model.movingAverages.sma20),
    dateIndex,
    xForIndex,
    yForPrice,
  });
  const sma50 = pathForSeries({
    series: visibleSeries(model.movingAverages.sma50),
    dateIndex,
    xForIndex,
    yForPrice,
  });
  const sma200 = pathForSeries({
    series: visibleSeries(model.movingAverages.sma200),
    dateIndex,
    xForIndex,
    yForPrice,
  });

  const priceTicks = Array.from({ length: 6 }, (_, index) => {
    const ratio = index / 5;
    const price = priceMax - (priceMax - priceMin) * ratio;
    return { price, y: PRICE_TOP + (PRICE_BOTTOM - PRICE_TOP) * ratio };
  });
  const labelCount = Math.min(6, bars.length);
  const dateTicks = Array.from({ length: labelCount }, (_, index) => {
    const barIndex = Math.round((index / Math.max(1, labelCount - 1)) * (bars.length - 1));
    return { index: barIndex, bar: bars[barIndex]! };
  }).filter((entry, index, entries) =>
    index === 0 || entry.index !== entries[index - 1]?.index,
  );

  const zones = [...model.zones.supports, ...model.zones.resistances];
  const chartTitle = [symbol?.trim().toUpperCase(), "TEKNISK ANALYS"]
    .filter(Boolean)
    .join(" · ");

  return (
    <figure className={`border-y border-white/12 bg-[#090d12] ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{chartTitle}</div>
          <div className="mt-1 text-[11px] text-slate-600">
            Data t.o.m. {model.asOf ?? "okänt datum"} · {model.sessions} verifierade handelssessioner
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.11em] text-slate-500">
          <span><span className="mr-1 inline-block h-px w-4 bg-slate-300 align-middle" />MA20</span>
          <span><span className="mr-1 inline-block h-px w-4 bg-blue-400 align-middle" />MA50</span>
          <span><span className="mr-1 inline-block h-px w-4 bg-amber-400 align-middle" />MA200</span>
          <span className="text-emerald-300">■ stöd</span>
          <span className="text-red-300">■ motstånd</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${chartTitle}. Candlestickgraf med volym, glidande medelvärden och automatiskt identifierade stöd- och motståndszoner.`}
      >
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="#090d12" />

        {priceTicks.map((tick) => (
          <g key={tick.y}>
            <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={tick.y} y2={tick.y} stroke="#1b2430" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text x={AXIS_LABEL_X} y={tick.y + 4} fill="#64748b" fontSize="12" fontFamily="ui-sans-serif, system-ui, sans-serif">
              {priceLabel(tick.price)}
            </text>
          </g>
        ))}

        {zones.map((zone, index) => {
          const style = zoneStyle(zone);
          const top = yForPrice(zone.upper);
          const bottom = yForPrice(zone.lower);
          const y = Math.min(top, bottom);
          const height = Math.max(3, Math.abs(bottom - top));
          return (
            <g key={`${zone.kind}-${zone.center}-${index}`}>
              <rect
                x={PLOT_LEFT}
                y={y}
                width={PLOT_RIGHT - PLOT_LEFT}
                height={height}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={zone.strength === "strong" ? 1.5 : 1}
                strokeDasharray={zone.strength === "weak" ? "5 5" : undefined}
                vectorEffect="non-scaling-stroke"
              />
              <text x={PLOT_LEFT + 10} y={Math.max(PRICE_TOP + 13, y + 14)} fill={style.text} fontSize="11" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
                {zoneLabel(zone)} · {zone.touches} TEST{zone.touches === 1 ? "" : "ER"}
              </text>
            </g>
          );
        })}

        {bars.map((bar, index) => {
          const x = xForIndex(index);
          const bullish = bar.close >= bar.open;
          const color = bullish ? "#22c55e" : "#ef4444";
          const bodyTop = yForPrice(Math.max(bar.open, bar.close));
          const bodyBottom = yForPrice(Math.min(bar.open, bar.close));
          const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);
          return (
            <g key={bar.date}>
              <line x1={x} x2={x} y1={yForPrice(bar.high)} y2={yForPrice(bar.low)} stroke={color} strokeWidth="1.15" vectorEffect="non-scaling-stroke" />
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={bullish ? "#123d2a" : color} stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}

        {sma20 ? <path d={sma20} fill="none" stroke="#cbd5e1" strokeWidth="1.2" opacity="0.72" vectorEffect="non-scaling-stroke" /> : null}
        {sma50 ? <path d={sma50} fill="none" stroke="#60a5fa" strokeWidth="1.7" vectorEffect="non-scaling-stroke" /> : null}
        {sma200 ? <path d={sma200} fill="none" stroke="#fbbf24" strokeWidth="1.7" vectorEffect="non-scaling-stroke" /> : null}

        {finite(model.currentPrice) ? (
          <g>
            <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={yForPrice(model.currentPrice)} y2={yForPrice(model.currentPrice)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 4" opacity="0.7" vectorEffect="non-scaling-stroke" />
            <rect x={PLOT_RIGHT + 5} y={yForPrice(model.currentPrice) - 10} width="84" height="20" fill="#e2e8f0" />
            <text x={PLOT_RIGHT + 47} y={yForPrice(model.currentPrice) + 4} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
              {priceLabel(model.currentPrice)}{currency ? ` ${currency}` : ""}
            </text>
          </g>
        ) : null}

        <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={VOLUME_TOP - 14} y2={VOLUME_TOP - 14} stroke="#1b2430" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <text x={PLOT_LEFT} y={VOLUME_TOP - 22} fill="#64748b" fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
          Volym · max {compactVolume(maxVolume)}
        </text>

        {bars.map((bar, index) => {
          const x = xForIndex(index);
          const y = yForVolume(bar.volume);
          const bullish = bar.close >= bar.open;
          return (
            <rect key={`volume-${bar.date}`} x={x - candleWidth / 2} y={y} width={candleWidth} height={Math.max(1, VOLUME_BOTTOM - y)} fill={bullish ? "rgba(34,197,94,0.42)" : "rgba(239,68,68,0.42)"} />
          );
        })}

        {dateTicks.map(({ index, bar }) => {
          const x = xForIndex(index);
          return (
            <g key={`date-${bar.date}`}>
              <line x1={x} x2={x} y1={VOLUME_BOTTOM + 4} y2={VOLUME_BOTTOM + 10} stroke="#475569" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <text x={x} y={VOLUME_BOTTOM + 28} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
                {dateLabel(bar.date)}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="border-t border-white/10 py-3 text-[11px] leading-5 text-slate-600">
        DivLab ritar nivåerna från verifierad historisk pris- och volymdata. Zonerna är analysområden, inte garanterade vändpunkter eller personlig investeringsrådgivning.
      </figcaption>
    </figure>
  );
}
