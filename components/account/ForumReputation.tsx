import { forumReputation } from "@/data/account";
import AccountIcon from "./AccountIcon";

export default function ForumReputation() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-2.5 text-[#D4AF37]">
            <AccountIcon name="award" />
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
              Forum Reputation
            </p>
            <h3 className="text-lg font-semibold text-white">
              Community credibility
            </h3>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-6 text-gray-400">
          Reputation reflects helpful, high-signal participation inside the
          Dividend Lab community.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {forumReputation.map((metric) => (
          <article
            key={metric.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-gray-500">
              {metric.label}
            </p>
            <p className="mt-5 text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-white tabular-nums">
              {metric.value}
            </p>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              {metric.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
