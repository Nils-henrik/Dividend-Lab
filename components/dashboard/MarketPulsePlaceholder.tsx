const placeholderItems = [
  {
    headline: "Utdelningsbolag i fokus inför rapportperiod",
    source: "Affärsvärlden",
    time: "Senaste 24 h",
  },
  {
    headline: "Ränteläge och utdelningsaktier i europeisk kontext",
    source: "Di.se",
    time: "Igår",
  },
  {
    headline: "Fonder med utdelningsfokus under lupp",
    source: "Placeringsguiden",
    time: "2 dagar sedan",
  },
];

export default function MarketPulsePlaceholder() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Marknadspuls
          </p>
          <h2 className="text-lg font-semibold text-white">Senaste affärsnyheter</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Plats för framtida nyhetsflöde. Endast rubrik, källa och tid visas
            här.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
          Kommer snart
        </span>
      </div>

      <div className="space-y-3">
        {placeholderItems.map((item) => (
          <article
            key={item.headline}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <p className="text-sm font-medium leading-6 text-gray-300">
              {item.headline}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>{item.source}</span>
              <span className="h-1 w-1 rounded-full bg-gray-600" />
              <span>{item.time}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
