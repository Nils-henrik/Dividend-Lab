"use client";

import { useEffect, useRef, useState } from "react";

const WIDGET_SCRIPT =
  "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";

const MARKET_OPTIONS = [
  { id: "omxs30", label: "OMXS30", symbol: "OMXSTO:OMXS30" },
  { id: "sp500", label: "S&P 500", symbol: "FOREXCOM:SPXUSD" },
  { id: "nasdaq100", label: "Nasdaq 100", symbol: "FOREXCOM:NSXUSD" },
  { id: "dax", label: "DAX", symbol: "FOREXCOM:GRXEUR" },
  { id: "gold", label: "Guld", symbol: "TVC:GOLD" },
] as const;

type MarketOption = (typeof MARKET_OPTIONS)[number];

function buildWidgetConfig(option: MarketOption, height: number) {
  return {
    symbols: [[option.label, `${option.symbol}|1D`]],
    chartOnly: false,
    width: "100%",
    height: String(height),
    locale: "sv",
    colorTheme: "dark",
    isTransparent: true,
    showVolume: false,
    showMA: false,
    lineWidth: 2,
    lineColor: "rgba(10, 132, 255, 1)",
    topColor: "rgba(10, 132, 255, 0.24)",
    bottomColor: "rgba(10, 132, 255, 0)",
    gridLineColor: "rgba(255, 255, 255, 0.05)",
    fontColor: "rgba(161, 161, 170, 1)",
  };
}

type Props = {
  compact?: boolean;
};

export default function MarketToday({ compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedOption, setSelectedOption] = useState<MarketOption>(
    MARKET_OPTIONS[0],
  );
  const widgetHeight = compact ? 280 : 420;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const widgetRoot = document.createElement("div");
    widgetRoot.className = "tradingview-widget-container";
    widgetRoot.style.height = "100%";
    widgetRoot.style.width = "100%";

    const widgetBody = document.createElement("div");
    widgetBody.className = "tradingview-widget-container__widget";
    widgetRoot.appendChild(widgetBody);

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT;
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify(buildWidgetConfig(selectedOption, widgetHeight));
    widgetRoot.appendChild(script);

    const copyright = document.createElement("div");
    copyright.className =
      "tradingview-widget-copyright text-[10px] text-divlab-text-subtle";
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/symbols/" rel="noopener nofollow" target="_blank" class="text-divlab-text-muted hover:text-divlab-text-secondary">Marknader</a> av TradingView';
    widgetRoot.appendChild(copyright);

    container.appendChild(widgetRoot);
  }, [selectedOption, widgetHeight]);

  return (
    <section className={`divlab-card h-full ${compact ? "p-5 sm:p-6" : "p-6"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="divlab-section-label">Marknaden idag</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-divlab-text">
            Börsen i korthet
          </h2>
          {!compact && (
            <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
              Följ marknaden via TradingView.
            </p>
          )}
        </div>

        <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0">
          {MARKET_OPTIONS.map((option) => {
            const isActive = selectedOption.id === option.id;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                aria-label={`Visa ${option.label} i marknadsgrafen`}
                onClick={() => setSelectedOption(option)}
                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${
                  isActive
                    ? "divlab-selected"
                    : "border-transparent bg-divlab-surface text-divlab-text-muted hover:text-divlab-text-secondary"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={selectedOption.id}
        ref={containerRef}
        className={`mt-4 overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface ${
          compact ? "min-h-[280px]" : "min-h-[420px]"
        }`}
      />
    </section>
  );
}
