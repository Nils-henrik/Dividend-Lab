import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumPageHeader from "./ForumPageHeader";
import ForumSubnav from "./ForumSubnav";

export default function ForumBolagPlaceholderPage() {
  return (
    <div className="space-y-3">
      <ForumSubnav />

      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: "Bolag" },
        ]}
      />

      <ForumPageHeader
        title="Bolag"
        description="Här kommer du att kunna hitta och följa diskussioner om svenska och amerikanska bolag."
        showCreateAction={false}
      />

      <section className="divlab-card p-8 text-center">
        <p className="text-sm font-medium text-divlab-text">
          Bolagsdiskussioner kommer snart
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-divlab-text-muted">
          Vi bygger en sökbar bolagskatalog där varje bolag får en gemensam
          diskussionsyta. Till dess kan du fortsätta diskutera i forumets
          kategorier.
        </p>
      </section>
    </div>
  );
}
