import {
  formatGav,
  formatMoney,
  formatPercent,
  formatQuantity,
  GAV_EVENT_LABELS,
} from "@/lib/gav/format";
import type { GavCalculationResult } from "@/lib/gav/types";

type Props = {
  calculation: GavCalculationResult;
  showMoreDecimals: boolean;
  securityName: string;
  onToggleDecimals: () => void;
};

function ResultValue({
  label,
  value,
  sentiment,
}: {
  label: string;
  value: string;
  sentiment?: "positive" | "negative" | "neutral";
}) {
  const valueClass =
    sentiment === "positive"
      ? "text-green-300"
      : sentiment === "negative"
        ? "text-red-300"
        : "text-divlab-text";
  const status =
    sentiment === "positive"
      ? "Positivt"
      : sentiment === "negative"
        ? "Negativt"
        : null;

  return (
    <div className="min-w-0 border-b border-white/[0.06] py-3 last:border-b-0">
      <dt className="text-xs leading-5 text-divlab-text-muted">{label}</dt>
      <dd className={`mt-1 break-words text-lg font-semibold ${valueClass}`}>
        {value}
      </dd>
      {status ? (
        <span className="text-[11px] font-medium text-divlab-text-muted">
          {status}
        </span>
      ) : null}
    </div>
  );
}

function sentimentFor(value: import("decimal.js-light").default) {
  if (value.gt(0)) return "positive" as const;
  if (value.lt(0)) return "negative" as const;
  return "neutral" as const;
}

export default function GavResults({
  calculation,
  showMoreDecimals,
  securityName,
  onToggleDecimals,
}: Props) {
  if (!calculation.hasActivity) {
    return (
      <aside className="divlab-card p-5 sm:p-6" aria-labelledby="gav-result-heading">
        <h3
          id="gav-result-heading"
          className="text-lg font-semibold text-divlab-text"
        >
          Ditt resultat
        </h3>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Lägg till minst ett innehav eller en händelse för att göra
          beräkningen.
        </p>
      </aside>
    );
  }

  if (!calculation.summary) {
    return (
      <aside className="divlab-card p-5 sm:p-6" aria-labelledby="gav-result-heading">
        <h3
          id="gav-result-heading"
          className="text-lg font-semibold text-divlab-text"
        >
          Ditt resultat
        </h3>
        <p className="mt-3 rounded-xl border border-red-300/20 bg-red-300/[0.05] px-3 py-2.5 text-sm leading-6 text-red-100">
          Kontrollera de markerade fälten innan resultatet kan räknas ut.
        </p>
      </aside>
    );
  }

  const { summary } = calculation;

  return (
    <aside
      className="gav-results min-w-0 space-y-5"
      aria-labelledby="gav-result-heading"
    >
      <section className="divlab-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="divlab-section-label text-divlab-blue-muted">
              Aktuellt innehav
            </p>
            <h3
              id="gav-result-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-divlab-text"
            >
              {securityName.trim() || "Ditt resultat"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onToggleDecimals}
            className="gav-no-print inline-flex min-h-11 items-center rounded-xl border divlab-border-neutral px-3 text-xs font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
          >
            {showMoreDecimals ? "Visa två decimaler" : "Visa fler decimaler"}
          </button>
        </div>

        {!calculation.isValid ? (
          <p className="gav-no-print mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-3 py-2.5 text-xs leading-5 text-amber-100">
            Primärresultatet är beräknat. Kontrollera det markerade
            jämförelsefältet för att visa alla marknadsvärden.
          </p>
        ) : null}

        <dl className="mt-5 grid min-w-0 gap-x-6 sm:grid-cols-2">
          <ResultValue
            label="Aktuellt GAV"
            value={
              summary.gav
                ? formatGav(summary.gav, showMoreDecimals)
                : "—"
            }
          />
          <ResultValue
            label="Antal kvar"
            value={formatQuantity(summary.quantity)}
          />
          <ResultValue
            label="Totalt omkostnadsbelopp"
            value={formatMoney(summary.totalCostBasis)}
          />
          <ResultValue
            label="Realiserat resultat"
            value={formatMoney(summary.realizedResult)}
            sentiment={sentimentFor(summary.realizedResult)}
          />
          {summary.marketValue ? (
            <ResultValue
              label="Marknadsvärde"
              value={formatMoney(summary.marketValue)}
            />
          ) : null}
          {summary.unrealizedResult ? (
            <ResultValue
              label="Orealiserat resultat"
              value={formatMoney(summary.unrealizedResult)}
              sentiment={sentimentFor(summary.unrealizedResult)}
            />
          ) : null}
          {summary.unrealizedPercent ? (
            <ResultValue
              label="Orealiserat resultat i procent"
              value={formatPercent(summary.unrealizedPercent)}
              sentiment={sentimentFor(summary.unrealizedPercent)}
            />
          ) : null}
          {summary.breakEvenPrice ? (
            <ResultValue
              label="Nollresultat efter försäljningscourtage"
              value={formatGav(
                summary.breakEvenPrice,
                showMoreDecimals,
              )}
            />
          ) : null}
        </dl>
      </section>

      {calculation.steps.length ? (
        <details className="divlab-card group overflow-hidden p-5 sm:p-6">
          <summary className="min-h-11 cursor-pointer list-none text-sm font-semibold text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40">
            <span className="inline-flex min-h-11 items-center">
              Visa beräkningen steg för steg
            </span>
          </summary>
          <div className="mt-4 space-y-3">
            {calculation.steps.map((step) => (
              <article
                key={step.eventId}
                className="rounded-xl border divlab-border-neutral bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-divlab-text">
                    {step.date || `Händelse ${step.eventNumber}`}
                  </h4>
                  <p className="text-xs font-medium text-divlab-blue-muted">
                    {GAV_EVENT_LABELS[step.type]}
                  </p>
                </div>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-divlab-text-muted">Antal efter</dt>
                    <dd className="mt-0.5 text-divlab-text-secondary">
                      {formatQuantity(step.quantity)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-divlab-text-muted">
                      Omkostnadsbelopp efter
                    </dt>
                    <dd className="mt-0.5 text-divlab-text-secondary">
                      {formatMoney(step.totalCostBasis)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-divlab-text-muted">GAV efter</dt>
                    <dd className="mt-0.5 text-divlab-text-secondary">
                      {step.gav
                        ? formatGav(step.gav, showMoreDecimals)
                        : "—"}
                    </dd>
                  </div>
                  {step.realizedResult ? (
                    <div>
                      <dt className="text-divlab-text-muted">
                        Realiserat resultat i händelsen
                      </dt>
                      <dd className="mt-0.5 text-divlab-text-secondary">
                        {formatMoney(step.realizedResult)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </aside>
  );
}
