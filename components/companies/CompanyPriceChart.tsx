"use client";

import { useEffect, useRef, useState } from "react";

const WIDGET_SCRIPT =
  "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";

type Props = {
  companyName: string;
  symbol: string;
};

function getResolvedTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function buildWidgetConfig(
  companyName: string,
  symbol: string,
  theme: "light" | "dark",
) {
  const dark = theme === "dark";

  return {
    symbols: [[companyName, `${symbol}|1D`]],
    chartOnly: false,
    width: "100%",
    height: "360",
    locale: "sv",
    colorTheme: theme,
    autosize: false,
    showVolume: true,
    showMA: false,
    hideDateRanges: false,
    hideMarketStatus: false,
    hideSymbolLogo: false,
    scalePosition: "right",
    scaleMode: "Normal",
    fontSize: "12",
    noTimeScale: false,
    valuesTracking: "1",
    changeMode: "price-and-percent",
    chartType: "area",
    lineWidth: 2,
    lineColor: "rgba(10, 132, 255, 1)",
    topColor: "rgba(10, 132, 255, 0.22)",
    bottomColor: "rgba(10, 132, 255, 0)",
    gridLineColor: dark
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(15, 23, 42, 0.08)",
  };
}

export default function CompanyPriceChart({ companyName, symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setTheme(getResolvedTheme());
    const observer = new MutationObserver(syncTheme);

    syncTheme();
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !theme) {
      return;
    }

    container.replaceChildren();

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
    script.innerHTML = JSON.stringify(
      buildWidgetConfig(companyName, symbol, theme),
    );
    widgetRoot.appendChild(script);

    const copyright = document.createElement("div");
    copyright.className =
      "tradingview-widget-copyright px-3 pb-2 text-right text-[10px] text-divlab-text-subtle";
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/symbols/" rel="noopener nofollow" target="_blank" class="text-divlab-text-muted hover:text-divlab-text-secondary">Kursgraf</a> av TradingView';
    widgetRoot.appendChild(copyright);

    container.appendChild(widgetRoot);
  }, [companyName, symbol, theme]);

  return (
    <div
      ref={containerRef}
      className="min-h-[360px] overflow-hidden rounded-xl bg-divlab-surface"
      aria-label={`Kursgraf för ${companyName}`}
      aria-busy={!theme}
    />
  );
}
