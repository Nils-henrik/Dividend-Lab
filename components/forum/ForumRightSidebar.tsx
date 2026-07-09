import ForumTrending from "./ForumTrending";
import LatestReplies from "./LatestReplies";
import MostHelpful from "./MostHelpful";

function AsidePanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="divlab-aside-panel">
      <h2 className="divlab-aside-panel-title">{title}</h2>
      {description && (
        <p className="mt-1.5 text-[11px] leading-5 text-divlab-text-muted">
          {description}
        </p>
      )}
      {children}
    </section>
  );
}

export default function ForumRightSidebar() {
  return (
    <aside className="space-y-3">
      <AsidePanel
        title="Dividend Brain Ready"
        description="Framtida AI-integration kan rekommendera diskussioner, utbildningsinnehåll och trådanalys utifrån denna struktur."
      />

      <AsidePanel title="Trendande diskussioner">
        <ForumTrending embedded />
      </AsidePanel>

      <AsidePanel title="Senaste svaren">
        <LatestReplies embedded />
      </AsidePanel>

      <AsidePanel
        title="Mest hjälpsamma denna vecka"
        description="Utmärkelser baseras på kvalitativa bidrag, inte popularitet."
      >
        <MostHelpful embedded />
      </AsidePanel>
    </aside>
  );
}
