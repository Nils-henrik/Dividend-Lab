"use client";

import { useEffect, useRef, useState } from "react";

const WIDGET_SCRIPT =
  "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";

const MARKET_OPTIONS = [
  { id: "omxs30", label: "OMXS30", symbol: "OMXSTO:OMXS30" },
  { id: "sp500", label: "S&P 500", symbol: "FOREXCOM:SPXUSD", interval: "1D" },
  { id: "nasdaq100", label: "Nasdaq 100", symbol: "FOREXCOM:NSXUSD", interval: "1D" },
  { id: "dax", label: "DAX", symbol: "FOREXCOM:GRXEUR", interval: "1D" },
  { id: "gold", label: "Guld", symbol: "TVC:GOLD" },
] as const;

type MarketOption = (typeof MARKET_OPTIONS)[number];

function buildWidgetConfig(option: MarketOption) {
  const suffix = "interval" in option ? option.interval : option.label;

  return {
    symbols: [[`${option.symbol}|${suffix}`]],
    chartOnly: false,
    width: "100%",
    height: "420",
    locale: "sv",
    colorTheme: "dark",
    isTransparent: true,
    showVolume: false,
    showMA: false,
    lineWidth: 2,
    lineColor: "rgba(10, 132, 255, 1)",
    topColor: "rgba(10, 132, 255, 0.28)",
    bottomColor: "rgba(10, 132, 255, 0)",
    gridLineColor: "rgba(255, 255, 255, 0.06)",
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
    script.innerHTML = JSON.stringify(buildWidgetConfig(selectedOption));
    widgetRoot.appendChild(script);

    const copyright = document.createElement("div");
    copyright.className =
      "tradingview-widget-copyright text-[10px] text-divlab-text-subtle";
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/symbols/" rel="noopener nofollow" target="_blank" class="text-divlab-text-muted hover:text-divlab-text-secondary">Marknader</a> av TradingView';
    widgetRoot.appendChild(copyright);

    container.appendChild(widgetRoot);
  }, [selectedOption]);

  return (
    <section className={`divlab-card ${compact ? "p-5" : "p-6"}`}>
      <div className={compact ? "mb-4" : "mb-6"}>
        <p className="mb-2 divlab-section-label">Marknadsläge</p>
        <h2 className="text-base font-semibold text-divlab-text">Börsen idag</h2>
        {!compact && (
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Följ marknaden via TradingView.
          </p>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {MARKET_OPTIONS.map((option) => {
          const isActive = selectedOption.id === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedOption(option)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
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

      <div
        key={selectedOption.id}
        ref={containerRef}
        className="min-h-[420px] overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface"
      />
    </section>
  );
}
