import { investorLevel } from "@/data/account";

export default function InvestorLevelCard() {
  return (
    <article className="divlab-card p-6">
      <p className="mb-3 divlab-section-label">Investerarnivå</p>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h3 className="text-lg font-semibold text-divlab-text">
            {investorLevel.current}
          </h3>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Investerarnivå byggs upp genom aktivitet och bidrag. Den är
            separat från betalt medlemskap och kan inte köpas.
          </p>
        </div>

        <span className="w-fit rounded-full border divlab-border-neutral divlab-inset px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
          Intjänad nivå
        </span>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <span className="text-4xl font-medium tracking-[-0.04em] text-divlab-text tabular-nums">
            {investorLevel.progress}%
          </span>
          <span className="text-sm text-divlab-text-secondary">
            Framsteg mot {investorLevel.next}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-divlab-blue"
            style={{ width: `${investorLevel.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-2 border-t divlab-border-neutral pt-6 sm:grid-cols-5">
        {investorLevel.hierarchy.map((level) => {
          const isCurrentLevel = level === investorLevel.current;

          return (
            <div
              key={level}
              className={`rounded-xl border px-3 py-3 text-center text-xs font-medium transition ${
                isCurrentLevel
                  ? "divlab-selected"
                  : "border-transparent divlab-inset text-divlab-text-muted"
              }`}
            >
              {level}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm leading-6 text-divlab-text-secondary">
        {investorLevel.contributionSummary}
      </p>
    </article>
  );
}
