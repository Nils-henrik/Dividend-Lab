import StatisticCard from "./StatisticCard";
import DividendChart from "./DividendChart";
export default function Dashboard() {
  return (
    <div className="w-[650px] rounded-3xl border border-white/10 bg-[#111111]/80 p-6 backdrop-blur">

      <p className="mb-6 text-sm uppercase tracking-widest text-gray-400">
        Översikt
      </p>

      <div className="grid grid-cols-3 gap-4">

        <StatisticCard
          title="Årlig utdelning"
          value="86 420 kr"
          change="+12.4%"
          icon="💰"
        />

        <StatisticCard
          title="Direktavkastning"
          value="4.83%"
          change="+0.32%"
          icon="%"
        />

        <StatisticCard
          title="Passiv inkomst"
          value="7 202 kr/mån"
          change="+8.7%"
          icon="📈"
        />

           </div>

      <DividendChart />
    </div>
  
      

);
}