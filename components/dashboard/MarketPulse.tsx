import {
  formatMarketPulseTime,
  getMarketPulseItems,
} from "@/lib/news/market-pulse";

export default async function MarketPulse() {
  const { items, error } = await getMarketPulseItems();

  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
          Marknadspuls
        </p>
        <h2 className="text-lg font-semibold text-white">Senaste affärsnyheter</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Rubrik, källa och tid. Länkar går till originalkällan.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
          {error}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={`${item.source}-${item.url}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium leading-6 text-gray-300 transition hover:text-[#D4AF37]"
              >
                {item.title}
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>{item.source}</span>
                <span className="h-1 w-1 rounded-full bg-gray-600" />
                <span>{formatMarketPulseTime(item.publishedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-gray-600">
        DivLab visar endast rubrik och länk. Läs fullständigt innehåll hos
        respektive källa.
      </p>
    </section>
  );
}
