import { annualDividendGoal } from "@/data/dashboard";

export default function GoalsCard() {
  return (
    <div className="divlab-card p-6">
      <p className="mb-3 divlab-section-label">Mål</p>
      <h2 className="text-lg font-semibold text-divlab-text">
        Årligt utdelningsmål
      </h2>

      <div className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-4xl font-medium tracking-[-0.04em] text-divlab-text tabular-nums">
            {annualDividendGoal.progress}
          </span>
          <span className="text-sm text-divlab-text-secondary">Framsteg</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-2 w-[72%] rounded-full bg-divlab-blue" />
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 border-t divlab-border-neutral pt-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-divlab-text-muted">
            Nuvarande
          </p>
          <p className="mt-2 text-lg font-medium text-divlab-text tabular-nums">
            {annualDividendGoal.current}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-divlab-text-muted">
            Mål
          </p>
          <p className="mt-2 text-lg font-medium text-divlab-text tabular-nums">
            {annualDividendGoal.target}
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-6 text-divlab-text-secondary">
        {annualDividendGoal.message}
      </p>
    </div>
  );
}
