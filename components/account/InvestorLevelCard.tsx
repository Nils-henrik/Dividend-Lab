import { investorLevel } from "@/data/account";

export default function InvestorLevelCard() {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        Investerarnivå
      </p>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {investorLevel.current}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Investerarnivå byggs upp genom aktivitet och bidrag. Den är
            separat från betalt medlemskap och kan inte köpas.
          </p>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
          Intjänad nivå
        </span>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <span className="text-4xl font-medium tracking-[-0.04em] text-white tabular-nums">
            {investorLevel.progress}%
          </span>
          <span className="text-sm text-gray-400">
            Framsteg mot {investorLevel.next}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-[#D4AF37]"
            style={{ width: `${investorLevel.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-2 border-t border-white/10 pt-6 sm:grid-cols-5">
        {investorLevel.hierarchy.map((level) => {
          const isCurrentLevel = level === investorLevel.current;

          return (
            <div
              key={level}
              className={`rounded-xl border px-3 py-3 text-center text-xs font-medium transition ${
                isCurrentLevel
                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "border-white/10 bg-white/[0.03] text-gray-500"
              }`}
            >
              {level}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm leading-6 text-gray-400">
        {investorLevel.contributionSummary}
      </p>
    </article>
  );
}
