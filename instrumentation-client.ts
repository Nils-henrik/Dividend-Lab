function styleDashboardTicker() {
  if (window.location.pathname !== "/dashboard" && window.location.pathname !== "/dashboard/") {
    return;
  }

  const ticker = document.querySelector<HTMLElement>(
    'section[aria-label="Rullande marknadsöversikt"]',
  );

  if (!ticker) {
    return;
  }

  ticker.style.border = "0";
  ticker.style.borderBottom = "1px solid rgba(255, 255, 255, 0.08)";
  ticker.style.borderRadius = "0";
  ticker.style.background = "transparent";
  ticker.style.boxShadow = "none";

  const widgetContainer = ticker.firstElementChild as HTMLElement | null;
  if (widgetContainer) {
    widgetContainer.style.minHeight = "46px";
  }

  const attribution = ticker.querySelector<HTMLElement>(".tradingview-widget-copyright");
  if (attribution) {
    attribution.style.opacity = "0.4";
    attribution.style.fontSize = "8px";
    attribution.style.paddingBottom = "0";
  }
}

styleDashboardTicker();

const tickerObserver = new MutationObserver(() => {
  styleDashboardTicker();
});

tickerObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
