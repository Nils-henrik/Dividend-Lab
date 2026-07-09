import { investorStatistics } from "@/data/account";
import AccountIcon from "./AccountIcon";
import VisibilityBadge from "./VisibilityBadge";

export default function InvestorStatistics() {
  return (
    <section>
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="mb-3 divlab-section-label">Offentliga investeringssignaler</p>
          <h3 className="text-lg font-semibold text-divlab-text">
            Strategi, erfarenhet och sammanhang
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-divlab-text-secondary">
          Uppgifterna beskriver hur investeraren tänker och bidrar utan att
          göra förmögenhet till trovärdighetens källa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {investorStatistics.map((statistic) => (
          <article
            key={statistic.label}
            className="divlab-card p-5 transition-all duration-300 hover:border-divlab-border-strong"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border divlab-border-neutral divlab-inset p-2 text-divlab-text-muted">
                  <AccountIcon name={statistic.icon} className="h-3.5 w-3.5" />
                </div>
                <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-divlab-text-muted">
                  {statistic.label}
                </p>
              </div>
              <VisibilityBadge visibility={statistic.visibility} />
            </div>

            <p className="mt-5 text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-divlab-text tabular-nums">
              {statistic.value}
            </p>
            <p className="mt-4 text-sm leading-6 text-divlab-text-secondary">
              {statistic.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
