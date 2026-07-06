import StatisticCard from "./StatisticCard";
import DividendChart from "./DividendChart";

export default function Dashboard() {
  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.08)] backdrop-blur">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-400">
            Översikt
          </p>
          <p className="mt-1 text-xs text-gray-500">Demoportfölj</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.65)]" />
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