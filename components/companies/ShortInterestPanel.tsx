import { formatShortInterestPercent } from "@/lib/companies/short-interest/copy";
import type { CompanyShortInterest } from "@/lib/companies/short-interest/types";

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

  const percentLabel = interest.status === "present"
    && interest.aggregatePercent !== null
    && interest.aggregatePercent > 0
    ? interest.aggregatePercentLabel
    : null;
  const named = percentLabel ? interest.namedPositions.slice(0, 8) : [];

  return (
    <section id="blankning" className="divlab-card scroll-mt-28 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] text-divlab-text">Blankning</h2>
        <a
          href={interest.source.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[11px] font-semibold text-divlab-blue hover:text-divlab-blue-hover"
        >
          Blankningsregistret
        </a>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-divlab-text-muted">
        {interest.rules.aggregate} {interest.rules.significantPositions}
      </p>
      {interest.message ? (
        <p className="mt-4 text-xs leading-5 text-divlab-text-muted">{interest.message}</p>
      ) : null}
      {interest.status === "absent" ? (
        <p className="mt-2 text-xs leading-5 text-divlab-text-muted">{interest.rules.absenceIsNotZero}</p>
      ) : null}
      {percentLabel ? (
        <div className="mt-4">
          <p className="text-[10px] text-divlab-text-muted">{interest.labels.aggregate}</p>
          <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-divlab-text">
            {percentLabel}
          </p>
          {interest.aggregatePositionDate ? (
            <p className="mt-1 text-[11px] text-divlab-text-muted">
              Positionsdatum {date(interest.aggregatePositionDate)}. {interest.labels.source}.
            </p>
          ) : null}
          {named.length ? (
            <div className="mt-5">
              <h3 className="text-[13px] font-bold text-divlab-text">{interest.labels.significantPositions}</h3>
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
                    {named.map((row) => {
                      const rowLabel = formatShortInterestPercent(row.percent);
                      if (!rowLabel) return null;
                      return (
                        <tr key={`${row.holder}-${row.isin}-${row.positionDate}`} className="border-t divlab-border-neutral">
                          <td className="py-2 pr-3 font-semibold text-divlab-text">{row.holder}</td>
                          <td className="py-2 pr-3 tabular-nums">{rowLabel}</td>
                          <td className="py-2">{date(row.positionDate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {interest.namedPositions.length > named.length ? (
                <p className="mt-2 text-[11px] leading-5 text-divlab-text-muted">
                  Tabellen visar de största publicerade positionerna. Övriga finns i FI:s aktuella register.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-xs leading-5 text-divlab-text-muted">
              Inga namngivna positioner över 0,5 % finns publicerade för emittenten i den aktuella filen.
            </p>
          )}
        </div>
      ) : null}
      <p className="mt-4 text-[10px] text-divlab-text-muted">
        {interest.labels.source}
        {interest.source.fetchedAt ? ` · läst ${date(interest.source.fetchedAt)}` : ""}. {interest.history.reason}
      </p>
    </section>
  );
}
