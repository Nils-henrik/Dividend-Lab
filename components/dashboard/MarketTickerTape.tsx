"use client";

import { useEffect, useRef } from "react";

const WIDGET_SCRIPT =
  "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";

const TICKER_SYMBOLS = [
  { proName: "OMXSTO:OMXS30", title: "OMXS30" },
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
  { proName: "FOREXCOM:GRXEUR", title: "DAX" },
  { proName: "OANDA:USDSEK", title: "USD/SEK" },
  { proName: "OANDA:EURSEK", title: "EUR/SEK" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
  { proName: "TVC:GOLD", title: "Guld" },
] as const;

const WIDGET_CONFIG = {
  symbols: TICKER_SYMBOLS,
  showSymbolLogo: true,
  colorTheme: "dark",
  locale: "sv",
  largeChartUrl: "",
  isTransparent: true,
  displayMode: "adaptive",
};

export default function MarketTickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const widgetRoot = document.createElement("div");
    widgetRoot.className = "tradingview-widget-container";
    widgetRoot.style.width = "100%";

    const widgetBody = document.createElement("div");
    widgetBody.className = "tradingview-widget-container__widget";
    widgetRoot.appendChild(widgetBody);

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT;
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify(WIDGET_CONFIG);
    widgetRoot.appendChild(script);

    const copyright = document.createElement("div");
    copyright.className =
      "tradingview-widget-copyright px-3 pb-1 text-right text-[9px] text-divlab-text-subtle";
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/markets/" rel="noopener nofollow" target="_blank" class="text-divlab-text-muted hover:text-divlab-text-secondary">Marknadsdata</a> av TradingView';
    widgetRoot.appendChild(copyright);

    container.appendChild(widgetRoot);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <section
      aria-label="Rullande marknadsöversikt"
      className="overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface"
    >
      <div ref={containerRef} className="min-h-[52px] w-full" />
    </section>
  );
}
