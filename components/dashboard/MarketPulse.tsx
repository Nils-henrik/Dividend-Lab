import {
  formatMarketPulseTime,
  getMarketPulseItems,
} from "@/lib/news/market-pulse";

type Props = {
  compact?: boolean;
};

export default async function MarketPulse({ compact = false }: Props) {
  const { items, error } = await getMarketPulseItems();

  return (
    <section className={`divlab-card ${compact ? "p-5" : "p-6"}`}>
      <div className={compact ? "mb-4" : "mb-6"}>
        <p className="mb-2 divlab-section-label">Marknadspuls</p>
        <h2
          className={`font-semibold text-divlab-text ${compact ? "text-base" : "text-lg"}`}
        >
          Senaste affärsnyheter
        </h2>
        {!compact && (
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Rubrik, källa och tid. Länkar går till originalkällan.
          </p>
        )}
      </div>

      {error ? (
        <p className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-3 text-sm text-divlab-text-secondary">
          {error}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <article
              key={`${item.source}-${item.url}`}
              className="rounded-xl border divlab-border-neutral bg-divlab-surface px-4 py-3"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium leading-6 text-divlab-text-secondary transition hover:text-divlab-blue-muted"
              >
                {item.title}
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
                <span>{item.source}</span>
                <span className="h-1 w-1 rounded-full bg-divlab-text-subtle" />
                <span>{formatMarketPulseTime(item.publishedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-divlab-text-subtle">
        DivLab visar endast rubrik och länk. Läs fullständigt innehåll hos
        respektive källa.
      </p>
    </section>
  );
}
