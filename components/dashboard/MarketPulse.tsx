import {
  formatMarketPulseTime,
  getMarketPulseItems,
} from "@/lib/news/market-pulse";

type Props = {
  compact?: boolean;
};

export default async function MarketPulse({ compact = false }: Props) {
  const { items, error } = await getMarketPulseItems();
  const visibleItems = compact ? items.slice(0, 3) : items;

  return (
    <section className={`divlab-card ${compact ? "p-5 sm:p-6" : "p-6"}`}>
      <div>
        <p className="divlab-section-label">Marknadsnytt</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-divlab-text">
          Senaste rubrikerna
        </h2>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          Aktuella affärsnyheter från externa källor.
        </p>
      </div>

      {error ? (
        <p className="mt-5 rounded-xl border divlab-border-neutral divlab-inset px-4 py-3 text-sm text-divlab-text-secondary">
          {error}
        </p>
      ) : (
        <div className="mt-5">
          {visibleItems.map((item, index) => (
            <article
              key={`${item.source}-${item.url}`}
              className={`py-4 first:pt-0 last:pb-0 ${
                index > 0 ? "border-t divlab-border-neutral" : ""
              }`}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium leading-6 text-divlab-text transition hover:text-divlab-blue-muted"
              >
                {item.title}
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
                <span>{item.source}</span>
                <span aria-hidden="true">·</span>
                <span>{formatMarketPulseTime(item.publishedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-5 border-t divlab-border-neutral pt-4 text-xs leading-5 text-divlab-text-subtle">
        DivLab visar rubrik och länk. Fullständigt innehåll finns hos respektive källa.
      </p>
    </section>
  );
}
