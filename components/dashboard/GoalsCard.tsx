import { annualDividendGoal } from "@/data/dashboard";

export default function GoalsCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        Mål
      </p>
      <h2 className="text-lg font-semibold text-white">
        Årligt utdelningsmål
      </h2>

      <div className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-4xl font-medium tracking-[-0.04em] text-white tabular-nums">
            {annualDividendGoal.progress}
          </span>
          <span className="text-sm text-gray-400">Framsteg</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-2 w-[72%] rounded-full bg-[#D4AF37]" />
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Nuvarande
          </p>
          <p className="mt-2 text-lg font-medium text-white tabular-nums">
            {annualDividendGoal.current}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Mål
          </p>
          <p className="mt-2 text-lg font-medium text-white tabular-nums">
            {annualDividendGoal.target}
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-6 text-gray-400">
        {annualDividendGoal.message}
      </p>
    </div>
  );
}
