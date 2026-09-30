import {
  formatShortPercent,
  SHORT_INTEREST_MISSING_COPY,
  type CompanyShortInterest,
} from "@/lib/companies/short-interest";

function date(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export default function ShortInterestPanel({ interest }: { interest: CompanyShortInterest }) {
  if (interest.status === "unmatched") return null;

  return (
    <section id="blankning" className="divlab-card scroll-mt-28 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] text-divlab-text">Blankning</h2>
        <a
          href={interest.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[11px] font-semibold text-divlab-blue hover:text-divlab-blue-hover"
        >
          Blankningsregistret
        </a>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-divlab-text-muted">
        Summan omfattar rapporterade positioner över 0,1 % av aktiekapitalet. Positioner under den gränsen anmäls inte och ingår inte. Namngivna innehav publiceras när en position passerar 0,5 %.
      </p>
      {interest.status === "unavailable" ? (
        <p className="mt-4 text-xs leading-5 text-divlab-text-muted">
          FI:s blankningsregister kunde inte läsas just nu. Ingen blankningsnivå visas.
        </p>
      ) : null}
      {interest.status === "missing" ? (
        <p className="mt-4 text-xs leading-5 text-divlab-text-muted">{SHORT_INTEREST_MISSING_COPY}</p>
      ) : null}
      {interest.status === "available" && interest.aggregate ? (
        <div className="mt-4">
          <p className="text-[10px] text-divlab-text-muted">Summa rapporterad blankning</p>
          <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-divlab-text">
            {formatShortPercent(interest.aggregate.percent)}
          </p>
          <p className="mt-1 text-[11px] text-divlab-text-muted">
            Positionsdatum {date(interest.aggregate.positionDate)}. {interest.sourceLabel}.
          </p>
          {interest.named.length ? (
            <div className="mt-5">
              <h3 className="text-[13px] font-bold text-divlab-text">Större publicerade positioner</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[11px]">
                  <thead className="text-divlab-text-muted">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Innehavare</th>
                      <th className="py-2 pr-3 font-medium">Position</th>
                      <th className="py-2 font-medium">Positionsdatum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interest.named.map((row) => (
                      <tr key={`${row.holder}-${row.isin}-${row.positionDate}`} className="border-t divlab-border-neutral">
                        <td className="py-2 pr-3 font-semibold text-divlab-text">{row.holder}</td>
                        <td className="py-2 pr-3 tabular-nums">{formatShortPercent(row.percent)}</td>
                        <td className="py-2">{date(row.positionDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs leading-5 text-divlab-text-muted">
              Inga namngivna positioner över 0,5 % finns publicerade för emittenten i den aktuella filen.
            </p>
          )}
        </div>
      ) : null}
      <p className="mt-4 text-[10px] text-divlab-text-muted">
        {interest.sourceLabel}
        {interest.fetchedAt ? ` · läst ${date(interest.fetchedAt)}` : ""}. Historik visas inte, eftersom den aktuella filen bara beskriver nuläget.
      </p>
    </section>
  );
}
