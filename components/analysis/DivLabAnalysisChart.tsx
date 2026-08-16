"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  DivLabAnalysisChartModel,
  DivLabAnalysisChartZone,
} from "@/lib/analysis/chart-model";
import { AnalysisHorizons } from "./AnalysisHorizons";

const LWC_SCRIPT_ID = "divlab-lightweight-charts";
const LWC_SCRIPT_URL =
  "https://unpkg.com/lightweight-charts@5.2.0/dist/lightweight-charts.standalone.production.js";

type LwcTime = string | number | { year: number; month: number; day: number };

type LwcData = {
  time: LwcTime;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  value?: number;
  color?: string;
};

type LwcPriceScale = {
  applyOptions(options: Record<string, unknown>): void;
};

type LwcSeries = {
  setData(data: readonly LwcData[]): void;
  priceToCoordinate(price: number): number | null;
  coordinateToPrice(coordinate: number): number | null;
  createPriceLine(options: Record<string, unknown>): unknown;
  priceScale(): LwcPriceScale;
};

type LwcTimeScale = {
  fitContent(): void;
  setVisibleLogicalRange(range: { from: number; to: number }): void;
  coordinateToTime(x: number): LwcTime | null;
  timeToCoordinate(time: LwcTime): number | null;
  width(): number;
  subscribeVisibleTimeRangeChange(handler: () => void): void;
  unsubscribeVisibleTimeRangeChange(handler: () => void): void;
};

type LwcChart = {
  addSeries(definition: unknown, options?: Record<string, unknown>): LwcSeries;
  timeScale(): LwcTimeScale;
  remove(): void;
};

type LwcNamespace = {
  createChart(container: HTMLElement, options?: Record<string, unknown>): LwcChart;
  CandlestickSeries: unknown;
  HistogramSeries: unknown;
  LineSeries: unknown;
};

declare global {
  interface Window {
    LightweightCharts?: LwcNamespace;
  }
}

type DrawingMode = "cursor" | "level" | "trend" | "zone";

type DomainPoint = {
  time: LwcTime;
  price: number;
};

type UserDrawing =
  | { id: string; type: "level"; price: number }
  | { id: string; type: "trend" | "zone"; start: DomainPoint; end: DomainPoint };

type ScreenDrawing =
  | { id: string; type: "level"; y: number }
  | { id: string; type: "trend"; x1: number; y1: number; x2: number; y2: number }
  | { id: string; type: "zone"; x: number; y: number; width: number; height: number };

type ScreenZone = {
  key: string;
  kind: "support" | "resistance";
  y: number;
  height: number;
  label: string;
};

let lwcPromise: Promise<LwcNamespace> | null = null;

function loadLightweightCharts(): Promise<LwcNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("lightweight_charts_browser_only"));
  }
  if (window.LightweightCharts) return Promise.resolve(window.LightweightCharts);
  if (lwcPromise) return lwcPromise;

  lwcPromise = new Promise<LwcNamespace>((resolve, reject) => {
    const resolveLibrary = () => {
      if (window.LightweightCharts) resolve(window.LightweightCharts);
      else reject(new Error("lightweight_charts_global_missing"));
    };

    const existing = document.getElementById(LWC_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", resolveLibrary, { once: true });
      existing.addEventListener("error", () => reject(new Error("lightweight_charts_load_failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = LWC_SCRIPT_ID;
    script.src = LWC_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", resolveLibrary, { once: true });
    script.addEventListener("error", () => reject(new Error("lightweight_charts_load_failed")), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return lwcPromise;
}

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function safeVisibleSessions(value: number | undefined): number {
  if (!finite(value)) return 160;
  return Math.max(30, Math.min(260, Math.trunc(value)));
}

function priceLabel(value: number): string {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: value < 100 ? 2 : 1,
    maximumFractionDigits: value < 100 ? 2 : 1,
  }).format(value);
}

function zoneLabel(zone: DivLabAnalysisChartZone): string {
  const prefix = zone.kind === "support" ? "STÖD" : "MOTSTÅND";
  return `${prefix} ${priceLabel(zone.lower)}–${priceLabel(zone.upper)} · ${zone.touches} TEST${zone.touches === 1 ? "" : "ER"}`;
}

function drawingId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `drawing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toolClass(active: boolean): string {
  return `border-r border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.13em] transition ${
    active
      ? "bg-blue-400/10 text-blue-300"
      : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
  }`;
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
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<LwcChart | null>(null);
  const priceSeriesRef = useRef<LwcSeries | null>(null);
  const drawStartRef = useRef<DomainPoint | null>(null);
  const refreshOverlayRef = useRef<() => void>(() => undefined);
  const [mode, setMode] = useState<DrawingMode>("cursor");
  const [drawings, setDrawings] = useState<UserDrawing[]>([]);
  const [screenDrawings, setScreenDrawings] = useState<ScreenDrawing[]>([]);
  const [screenZones, setScreenZones] = useState<ScreenZone[]>([]);
  const [plotWidth, setPlotWidth] = useState(0);
  const [libraryError, setLibraryError] = useState(false);
  const [chartReady, setChartReady] = useState(0);
  const visibleSessions = safeVisibleSessions(requestedVisibleSessions);
  const drawingStorageKey = `divlab-analysis-drawings:${symbol?.trim().toUpperCase() || "chart"}`;

  refreshOverlayRef.current = () => {
    const chart = chartRef.current;
    const series = priceSeriesRef.current;
    if (!chart || !series) return;

    const width = chart.timeScale().width();
    setPlotWidth(width);

    const zones = [...model.zones.supports, ...model.zones.resistances]
      .map((zone, index): ScreenZone | null => {
        const top = series.priceToCoordinate(zone.upper);
        const bottom = series.priceToCoordinate(zone.lower);
        if (!finite(top) || !finite(bottom)) return null;
        return {
          key: `${zone.kind}-${zone.center}-${index}`,
          kind: zone.kind,
          y: Math.min(top, bottom),
          height: Math.max(3, Math.abs(bottom - top)),
          label: zoneLabel(zone),
        };
      })
      .filter((zone): zone is ScreenZone => zone !== null);
    setScreenZones(zones);

    const timeScale = chart.timeScale();
    const projected = drawings
      .map((drawing): ScreenDrawing | null => {
        if (drawing.type === "level") {
          const y = series.priceToCoordinate(drawing.price);
          return finite(y) ? { id: drawing.id, type: "level", y } : null;
        }
        const x1 = timeScale.timeToCoordinate(drawing.start.time);
        const y1 = series.priceToCoordinate(drawing.start.price);
        const x2 = timeScale.timeToCoordinate(drawing.end.time);
        const y2 = series.priceToCoordinate(drawing.end.price);
        if (![x1, y1, x2, y2].every(finite)) return null;
        if (drawing.type === "trend") {
          return { id: drawing.id, type: "trend", x1: x1!, y1: y1!, x2: x2!, y2: y2! };
        }
        return {
          id: drawing.id,
          type: "zone",
          x: Math.min(x1!, x2!),
          y: Math.min(y1!, y2!),
          width: Math.max(2, Math.abs(x2! - x1!)),
          height: Math.max(2, Math.abs(y2! - y1!)),
        };
      })
      .filter((drawing): drawing is ScreenDrawing => drawing !== null);
    setScreenDrawings(projected);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(drawingStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) setDrawings(parsed as UserDrawing[]);
      }
    } catch {
      // Browser-local drawings are optional. A corrupt entry should never block the chart.
    }
  }, [drawingStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(drawingStorageKey, JSON.stringify(drawings));
    } catch {
      // Ignore storage failures; the analysis chart remains fully usable.
    }
    refreshOverlayRef.current();
  }, [drawings, drawingStorageKey, chartReady]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || model.bars.length < 2) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadLightweightCharts()
      .then((lwc) => {
        if (cancelled) return;
        setLibraryError(false);

        const chart = lwc.createChart(container, {
          autoSize: true,
          layout: {
            background: { type: "solid", color: "#090d12" },
            textColor: "#64748b",
            fontSize: 11,
            attributionLogo: true,
          },
          grid: {
            vertLines: { color: "#151d27" },
            horzLines: { color: "#151d27" },
          },
          rightPriceScale: {
            borderColor: "#263241",
            scaleMargins: { top: 0.06, bottom: 0.24 },
          },
          timeScale: {
            borderColor: "#263241",
            rightOffset: 5,
            barSpacing: 6,
            minBarSpacing: 2,
            timeVisible: false,
          },
          localization: {
            locale: "sv-SE",
            priceFormatter: (price: number) => priceLabel(price),
          },
          crosshair: {
            vertLine: { color: "#475569", width: 1, style: 2, labelBackgroundColor: "#1e293b" },
            horzLine: { color: "#475569", width: 1, style: 2, labelBackgroundColor: "#1e293b" },
          },
        });
        chartRef.current = chart;

        const candleSeries = chart.addSeries(lwc.CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          priceLineVisible: false,
          lastValueVisible: true,
        });
        priceSeriesRef.current = candleSeries;
        candleSeries.setData(
          model.bars.map((bar) => ({
            time: bar.date,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          })),
        );
        candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.06, bottom: 0.24 } });

        const volumeSeries = chart.addSeries(lwc.HistogramSeries, {
          priceScaleId: "",
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
        });
        volumeSeries.setData(
          model.bars.map((bar) => ({
            time: bar.date,
            value: bar.volume,
            color: bar.close >= bar.open ? "rgba(34,197,94,0.38)" : "rgba(239,68,68,0.38)",
          })),
        );
        volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.80, bottom: 0.01 } });

        const addMa = (data: readonly { date: string; value: number }[], color: string, width: number) => {
          const series = chart.addSeries(lwc.LineSeries, {
            color,
            lineWidth: width,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          series.setData(data.map((point) => ({ time: point.date, value: point.value })));
        };
        addMa(model.movingAverages.sma20, "#cbd5e1", 1);
        addMa(model.movingAverages.sma50, "#60a5fa", 2);
        addMa(model.movingAverages.sma200, "#fbbf24", 2);

        if (finite(model.currentPrice)) {
          candleSeries.createPriceLine({
            price: model.currentPrice,
            color: "#e2e8f0",
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: currency ? `${currency}` : "Kurs",
          });
        }

        const from = Math.max(0, model.bars.length - visibleSessions);
        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(-0.5, from - 0.5),
          to: model.bars.length + 4,
        });

        const handleRange = () => window.requestAnimationFrame(() => refreshOverlayRef.current());
        chart.timeScale().subscribeVisibleTimeRangeChange(handleRange);
        const resizeObserver = new ResizeObserver(handleRange);
        resizeObserver.observe(container);
        setChartReady((value) => value + 1);
        window.requestAnimationFrame(() => refreshOverlayRef.current());

        cleanup = () => {
          resizeObserver.disconnect();
          chart.timeScale().unsubscribeVisibleTimeRangeChange(handleRange);
          chart.remove();
          chartRef.current = null;
          priceSeriesRef.current = null;
        };
      })
      .catch(() => {
        if (!cancelled) setLibraryError(true);
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [currency, model, visibleSessions]);

  function pointFromEvent(event: ReactPointerEvent<HTMLDivElement>): DomainPoint | null {
    const chart = chartRef.current;
    const series = priceSeriesRef.current;
    const target = interactionRef.current;
    if (!chart || !series || !target) return null;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (time === null || !finite(price)) return null;
    return { time, price };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode === "cursor") return;
    const point = pointFromEvent(event);
    if (!point) return;
    drawStartRef.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode === "cursor") return;
    const start = drawStartRef.current;
    const end = pointFromEvent(event);
    drawStartRef.current = null;
    if (!start || !end) return;

    if (mode === "level") {
      setDrawings((items) => [...items, { id: drawingId(), type: "level", price: end.price }]);
      return;
    }
    setDrawings((items) => [
      ...items,
      { id: drawingId(), type: mode, start, end } as UserDrawing,
    ]);
  }

  const chartTitle = [symbol?.trim().toUpperCase(), "TEKNISK ANALYS"]
    .filter(Boolean)
    .join(" · ");

  if (model.bars.length < 2) {
    return (
      <div className={`border-y border-white/10 bg-[#090d12] py-8 text-sm text-slate-500 ${className}`}>
        För lite verifierad prisdata för att rita analysgrafen.
      </div>
    );
  }

  return (
    <>
      <figure className={`border-y border-white/12 bg-[#090d12] ${className}`}>
        <div className="flex flex-col border-b border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="px-0 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{chartTitle}</div>
            <div className="mt-1 text-[11px] text-slate-600">
              Data t.o.m. {model.asOf ?? "okänt datum"} · zooma, panorera eller rita egna nivåer
            </div>
          </div>
          <div className="flex border-t border-white/10 sm:border-l sm:border-t-0" aria-label="Ritverktyg">
            <button type="button" onClick={() => setMode("cursor")} className={toolClass(mode === "cursor")} aria-pressed={mode === "cursor"}>Flytta</button>
            <button type="button" onClick={() => setMode("level")} className={toolClass(mode === "level")} aria-pressed={mode === "level"}>Nivå</button>
            <button type="button" onClick={() => setMode("trend")} className={toolClass(mode === "trend")} aria-pressed={mode === "trend"}>Trend</button>
            <button type="button" onClick={() => setMode("zone")} className={toolClass(mode === "zone")} aria-pressed={mode === "zone"}>Zon</button>
            <button type="button" onClick={() => setDrawings([])} className={toolClass(false)}>Rensa</button>
          </div>
        </div>

        <div className="relative h-[500px] w-full sm:h-[620px]">
          <div ref={chartContainerRef} className="absolute inset-0" />

          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible" aria-hidden="true">
            {screenZones.map((zone) => (
              <g key={zone.key}>
                <rect
                  x={0}
                  y={zone.y}
                  width={plotWidth}
                  height={zone.height}
                  fill={zone.kind === "support" ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)"}
                  stroke={zone.kind === "support" ? "rgba(34,197,94,0.58)" : "rgba(239,68,68,0.58)"}
                  strokeWidth={1}
                />
                <text
                  x={10}
                  y={Math.max(14, zone.y + 14)}
                  fill={zone.kind === "support" ? "#86efac" : "#fca5a5"}
                  fontSize={10}
                  fontWeight={700}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {zone.label}
                </text>
              </g>
            ))}

            {screenDrawings.map((drawing) => {
              if (drawing.type === "level") {
                return <line key={drawing.id} x1={0} x2={plotWidth} y1={drawing.y} y2={drawing.y} stroke="#38bdf8" strokeWidth={1.4} strokeDasharray="5 4" />;
              }
              if (drawing.type === "trend") {
                return <line key={drawing.id} x1={drawing.x1} y1={drawing.y1} x2={drawing.x2} y2={drawing.y2} stroke="#38bdf8" strokeWidth={1.6} />;
              }
              return (
                <rect
                  key={drawing.id}
                  x={drawing.x}
                  y={drawing.y}
                  width={drawing.width}
                  height={drawing.height}
                  fill="rgba(56,189,248,0.10)"
                  stroke="#38bdf8"
                  strokeWidth={1.2}
                />
              );
            })}
          </svg>

          <div
            ref={interactionRef}
            className={`absolute inset-0 z-20 ${mode === "cursor" ? "pointer-events-none" : "cursor-crosshair touch-none"}`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              drawStartRef.current = null;
            }}
            aria-hidden="true"
          />

          {libraryError ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#090d12] px-6 text-center text-sm text-red-300">
              TradingView-grafen kunde inte laddas. Analysdata och nivåer är fortfarande intakta.
            </div>
          ) : null}
        </div>

        <figcaption className="flex flex-col gap-1 border-t border-white/10 py-3 text-[11px] leading-5 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>DivLab-AI ritar stöd och motstånd från verifierad pris- och volymdata. Egna ritningar sparas endast lokalt i din webbläsare.</span>
          <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer" className="shrink-0 text-slate-500 hover:text-slate-300">
            Grafmotor: TradingView Lightweight Charts™
          </a>
        </figcaption>
      </figure>

      <AnalysisHorizons />
    </>
  );
}
