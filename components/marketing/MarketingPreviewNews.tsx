import {
  formatMarketPulseTime,
  getMarketPulseItems,
} from "@/lib/news/market-pulse";

export default async function MarketingPreviewNews() {
  const { items } = await getMarketPulseItems();
  const previewItems = items.slice(0, 2);

  return (
    <div className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
        Senaste nytt
      </p>

      {previewItems.length > 0 ? (
        <div className="mt-2 min-h-[104px] divide-y divide-white/[0.06]">
          {previewItems.map((item) => (
            <div
              key={`${item.source}-${item.url}`}
              className="py-2.5 first:pt-0 last:pb-0"
            >
              <p className="text-sm leading-5 text-divlab-text-secondary">
                {item.title}
              </p>
              <p className="mt-1 text-[10px] text-divlab-text-muted">
                {item.source}
                {item.publishedAt ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <time dateTime={item.publishedAt}>
                      {formatMarketPulseTime(item.publishedAt)}
                    </time>
                  </>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 min-h-[104px] text-[10px] leading-5 text-divlab-text-muted">
          Nyhetsflödet är inte tillgängligt just nu.
        </p>
      )}
    </div>
  );
}
