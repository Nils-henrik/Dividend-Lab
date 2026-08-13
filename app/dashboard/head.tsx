export default function Head() {
  return (
    <style>{`
      section[aria-label="Rullande marknadsöversikt"] {
        border: 0 !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 0 !important;
        background: transparent !important;
      }

      section[aria-label="Rullande marknadsöversikt"] > div {
        min-height: 46px !important;
      }

      section[aria-label="Rullande marknadsöversikt"] .tradingview-widget-copyright {
        opacity: 0.42;
        font-size: 8px !important;
        padding-bottom: 0 !important;
      }
    `}</style>
  );
}
