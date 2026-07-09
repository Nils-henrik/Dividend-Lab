import StatisticCard from "./StatisticCard";
import DividendChart from "./DividendChart";

export default function Dashboard() {
  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="divlab-section-label tracking-widest">Översikt</p>
          <p className="mt-1 text-xs text-divlab-text-muted">Demoportfölj</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-divlab-green/20 bg-divlab-green/10 px-3 py-1 text-xs font-medium text-divlab-green">
          <span className="h-1.5 w-1.5 rounded-full bg-divlab-green" />
          Aktiv
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatisticCard
          title="Årlig utdelning"
          value="86 420 kr"
          change="+12.4%"
        />

        <StatisticCard
          title="Direktavkastning"
          value="4.83%"
          change="+0.32%"
        />

        <StatisticCard
          title="Passiv inkomst"
          value="7 202 kr/mån"
          change="+8.7%"
        />
      </div>

      <DividendChart />
    </div>
  );
}
