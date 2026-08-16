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

type LwcPane = {
  getHeight(): number;
};

type LwcMediaScope = {
  context: CanvasRenderingContext2D;
  mediaSize: { width: number; height: number };
};

type LwcCanvasTarget = {
  useMediaCoordinateSpace(callback: (scope: LwcMediaScope) => void): void;
};

type LwcPrimitivePaneRenderer = {
  draw(target: LwcCanvasTarget): void;
};

type LwcPrimitivePaneView = {
  renderer(): LwcPrimitivePaneRenderer;
  zOrder?(): "bottom" | "normal" | "top";
};

type LwcPrimitive = {
  attached?(params: {
    chart: LwcChart;
    series: LwcSeries;
    requestUpdate: () => void;
  }): void;
  detached?(): void;
  updateAllViews?(): void;
  paneViews?(): readonly LwcPrimitivePaneView[];
};

type LwcSeries = {
  setData(data: readonly LwcData[]): void;
  priceToCoordinate(price: number): number | null;
  coordinateToPrice(coordinate: number): number | null;
  createPriceLine(options: Record<string, unknown>): unknown;
  priceScale(): LwcPriceScale;
  getPane(): LwcPane;
  attachPrimitive(primitive: LwcPrimitive): void;
  detachPrimitive(primitive: LwcPrimitive): void;
};

type LwcTimeScale = {
  setVisibleLogicalRange(range: { from: number; to: number }): void;
  coordinateToTime(x: number): LwcTime | null;
  timeToCoordinate(time: LwcTime): number | null;
  width(): number;
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

class AnalysisOverlayPrimitive implements LwcPrimitive {
  private chart: LwcChart | null = null;
  private series: LwcSeries | null = null;
  private requestUpdate: (() => void) | null = null;
  private drawings: UserDrawing[] = [];
  private readonly renderer: LwcPrimitivePaneRenderer;
  private readonly view: LwcPrimitivePaneView;

  constructor(private readonly zones: readonly DivLabAnalysisChartZone[]) {
    this.renderer = { draw: (target) => this.draw(target) };
    this.view = {
      renderer: () => this.renderer,
      zOrder: () => "top",
    };
  }

  attached(params: {
    chart: LwcChart;
    series: LwcSeries;
    requestUpdate: () => void;
  }) {
    this.chart = params.chart;
    this.series = params.series;
    this.requestUpdate = params.requestUpdate;
  }

  detached() {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
  }

  updateAllViews() {
    // Coordinates are resolved during every TradingView pane repaint so zoom,
    // pinch and pan can never leave stale DOM coordinates behind.
  }

  paneViews(): readonly LwcPrimitivePaneView[] {
    return [this.view];
  }

  setDrawings(drawings: readonly UserDrawing[]) {
    this.drawings = [...drawings];
    this.requestUpdate?.();
  }

  private draw(target: LwcCanvasTarget) {
    const chart = this.chart;
    const series = this.series;
    if (!chart || !series) return;

    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      const timeScale = chart.timeScale();
      context.save();
      context.beginPath();
      context.rect(0, 0, mediaSize.width, mediaSize.height);
      context.clip();

      for (const zone of this.zones) {
        const yUpper = series.priceToCoordinate(zone.upper);
        const yLower = series.priceToCoordinate(zone.lower);
        if (!finite(yUpper) || !finite(yLower)) continue;

        const top = Math.min(yUpper, yLower);
        const bottom = Math.max(yUpper, yLower);
        const visibleTop = Math.max(0, top);
        const visibleBottom = Math.min(mediaSize.height, bottom);
        if (visibleBottom <= visibleTop) continue;

        const support = zone.kind === "support";
        context.fillStyle = support ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)";
        context.strokeStyle = support ? "rgba(34,197,94,0.58)" : "rgba(239,68,68,0.58)";
        context.lineWidth = 1;
        context.fillRect(0, visibleTop, mediaSize.width, visibleBottom - visibleTop);
        context.strokeRect(0.5, visibleTop + 0.5, Math.max(0, mediaSize.width - 1), Math.max(1, visibleBottom - visibleTop - 1));

        const labelY = Math.min(mediaSize.height - 5, Math.max(13, visibleTop + 13));
        context.fillStyle = support ? "#86efac" : "#fca5a5";
        context.font = "700 10px ui-sans-serif, system-ui, sans-serif";
        context.textBaseline = "alphabetic";
        context.fillText(zoneLabel(zone), 10, labelY, Math.max(20, mediaSize.width - 20));
      }

      for (const drawing of this.drawings) {
        context.strokeStyle = "#38bdf8";
        context.fillStyle = "rgba(56,189,248,0.10)";
        context.lineWidth = 1.5;

        if (drawing.type === "level") {
          const y = series.priceToCoordinate(drawing.price);
          if (!finite(y) || y < 0 || y > mediaSize.height) continue;
          context.setLineDash([5, 4]);
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(mediaSize.width, y);
          context.stroke();
          context.setLineDash([]);
          continue;
        }

        const x1 = timeScale.timeToCoordinate(drawing.start.time);
        const y1 = series.priceToCoordinate(drawing.start.price);
        const x2 = timeScale.timeToCoordinate(drawing.end.time);
        const y2 = series.priceToCoordinate(drawing.end.price);
        if (![x1, y1, x2, y2].every(finite)) continue;

        if (drawing.type === "trend") {
          context.beginPath();
          context.moveTo(x1!, y1!);
          context.lineTo(x2!, y2!);
          context.stroke();
          continue;
        }

        const left = Math.min(x1!, x2!);
        const top = Math.min(y1!, y2!);
        const width = Math.abs(x2! - x1!);
        const height = Math.abs(y2! - y1!);
        context.fillRect(left, top, width, height);
        context.strokeRect(left, top, width, height);
      }

      context.restore();
    });
  }
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
  const overlayPrimitiveRef = useRef<AnalysisOverlayPrimitive | null>(null);
  const drawStartRef = useRef<DomainPoint | null>(null);
  const drawingsRef = useRef<UserDrawing[]>([]);
  const [mode, setMode] = useState<DrawingMode>("cursor");
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  const [libraryError, setLibraryError] = useState(false);
  const visibleSessions = safeVisibleSessions(requestedVisibleSessions);

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

        const overlayPrimitive = new AnalysisOverlayPrimitive([
          ...model.zones.supports,
          ...model.zones.resistances,
        ]);
        candleSeries.attachPrimitive(overlayPrimitive);
        overlayPrimitive.setDrawings(drawingsRef.current);
        overlayPrimitiveRef.current = overlayPrimitive;

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

        const updatePlotSize = () => {
          if (cancelled) return;
          const width = chart.timeScale().width();
          const height = candleSeries.getPane().getHeight();
          setPlotSize((previous) =>
            previous.width === width && previous.height === height ? previous : { width, height },
          );
        };
        const handleResize = () => window.requestAnimationFrame(updatePlotSize);
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
        window.requestAnimationFrame(updatePlotSize);

        cleanup = () => {
          resizeObserver.disconnect();
          try {
            candleSeries.detachPrimitive(overlayPrimitive);
          } catch {
            // chart.remove() below is the final cleanup boundary.
          }
          chart.remove();
          chartRef.current = null;
          priceSeriesRef.current = null;
          overlayPrimitiveRef.current = null;
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

  function pushDrawings(next: UserDrawing[]) {
    drawingsRef.current = next;
    overlayPrimitiveRef.current?.setDrawings(next);
  }

  function addDrawing(drawing: UserDrawing) {
    pushDrawings([...drawingsRef.current, drawing]);
  }

  function clearDrawings() {
    pushDrawings([]);
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
      addDrawing({ id: drawingId(), type: "level", price: end.price });
      return;
    }
    if (mode === "trend" || mode === "zone") {
      addDrawing({ id: drawingId(), type: mode, start, end });
    }
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
            <button type="button" onClick={clearDrawings} className={toolClass(false)}>Rensa</button>
          </div>
        </div>

        <div className="relative h-[500px] w-full overflow-hidden sm:h-[620px]">
          <div ref={chartContainerRef} className="absolute inset-0" />

          <div
            ref={interactionRef}
            className={`absolute left-0 top-0 z-20 ${mode === "cursor" ? "pointer-events-none" : "cursor-crosshair touch-none"}`}
            style={{
              width: plotSize.width || undefined,
              height: plotSize.height || undefined,
            }}
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
          <span>DivLab-AI ritar stöd och motstånd direkt i TradingViews chart-pane så nivåerna följer zoom och pan. Egna ritningar gäller den aktuella visningen.</span>
          <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer" className="shrink-0 text-slate-500 hover:text-slate-300">
            Grafmotor: TradingView Lightweight Charts™
          </a>
        </figcaption>
      </figure>

      <AnalysisHorizons />
    </>
  );
}
