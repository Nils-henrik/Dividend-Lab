"use client";

import { useEffect, useRef } from "react";

const WIDGET_SCRIPT =
  "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";

const widgetConfig = {
  colorTheme: "dark",
  dateRange: "1D",
  showChart: true,
  locale: "sv",
  largeChartUrl: "",
  isTransparent: true,
  showSymbolLogo: false,
  showFloatingTooltip: false,
  width: "100%",
  height: "420",
  plotLineColorGrowing: "rgba(212, 175, 55, 1)",
  plotLineColorFalling: "rgba(212, 175, 55, 1)",
  gridLineColor: "rgba(255, 255, 255, 0.06)",
  scaleFontColor: "rgba(156, 163, 175, 1)",
  belowLineFillColorGrowing: "rgba(212, 175, 55, 0.18)",
  belowLineFillColorFalling: "rgba(212, 175, 55, 0.12)",
  belowLineFillColorGrowingBottom: "rgba(212, 175, 55, 0)",
  belowLineFillColorFallingBottom: "rgba(212, 175, 55, 0)",
  symbolActiveColor: "rgba(212, 175, 55, 0.12)",
  tabs: [
    {
      title: "Index",
      symbols: [
        { s: "OMXSTO:OMXS30", d: "OMXS30" },
        { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
        { s: "NASDAQ:NDX", d: "Nasdaq 100" },
        { s: "XETR:DAX", d: "DAX" },
      ],
    },
    {
      title: "Valuta & råvaror",
      symbols: [
        { s: "FX:USDSEK", d: "USD/SEK" },
        { s: "FX:EURSEK", d: "EUR/SEK" },
        { s: "TVC:UKOIL", d: "Brentolja" },
        { s: "TVC:GOLD", d: "Guld" },
      ],
    },
  ],
};

export default function MarketToday() {
  const containerRef = useRef<HTMLDivElement>(null);

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
    script.innerHTML = JSON.stringify(widgetConfig);
    widgetRoot.appendChild(script);

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright";
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/markets/" rel="noopener nofollow" target="_blank"><span class="text-blue-600">Marknader</span></a> av TradingView';
    widgetRoot.appendChild(copyright);

    container.appendChild(widgetRoot);
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
          Marknadsläge
        </p>
        <h2 className="text-lg font-semibold text-white">Börsen idag</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Klickbara marknadssiffror från TradingView. Endast översikt — inte
          investeringsråd.
        </p>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]"
      />

      <p className="mt-4 text-xs leading-5 text-gray-600">
        Data och widget tillhandahålls av TradingView. DivLab kopierar inte
        innehåll från betaltjänster.
      </p>
    </section>
  );
}
