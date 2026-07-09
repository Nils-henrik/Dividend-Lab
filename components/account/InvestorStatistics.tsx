import { investorStatistics } from "@/data/account";
import AccountIcon from "./AccountIcon";
import VisibilityBadge from "./VisibilityBadge";

export default function InvestorStatistics() {
  return (
    <section>
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Offentliga investeringssignaler
          </p>
          <h3 className="text-lg font-semibold text-white">
            Strategi, erfarenhet och sammanhang
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-gray-400">
          Uppgifterna beskriver hur investeraren tänker och bidrar utan att
          göra förmögenhet till trovärdighetens källa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {investorStatistics.map((statistic) => (
          <article
            key={statistic.label}
            className="rounded-2xl border border-white/10 bg-[#161616] p-5 transition-all duration-300 hover:border-[#D4AF37]/40 hover:shadow-[0_0_24px_rgba(212,175,55,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-gray-500">
                  <AccountIcon name={statistic.icon} className="h-3.5 w-3.5" />
                </div>
                <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-gray-500">
                  {statistic.label}
                </p>
              </div>
              <VisibilityBadge visibility={statistic.visibility} />
            </div>

            <p className="mt-5 text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-white tabular-nums">
              {statistic.value}
            </p>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              {statistic.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
