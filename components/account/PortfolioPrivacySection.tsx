import { portfolioDisclosure, portfolioPrivacyMessage } from "@/data/account";
import AccountIcon from "./AccountIcon";

export default function PortfolioPrivacySection() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Portfolio Information
          </p>
          <h3 className="text-lg font-semibold text-white">
            Optional privacy-conscious disclosure
          </h3>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-gray-400">
          {portfolioPrivacyMessage}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {portfolioDisclosure.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-white/10 bg-[#161616] p-2 text-gray-500">
                  <AccountIcon name={item.icon} className="h-3.5 w-3.5" />
                </div>
                <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-gray-500">
                  {item.label}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Range
              </span>
            </div>

            <p className="mt-5 text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-white tabular-nums">
              {item.range}
            </p>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              {item.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
