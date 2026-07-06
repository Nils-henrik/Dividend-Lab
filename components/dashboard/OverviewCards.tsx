import StatisticCard from "@/components/marketing/StatisticCard";
import { overviewStats } from "@/data/dashboard";

export default function OverviewCards() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {overviewStats.map((stat) => (
        <StatisticCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          change={stat.change}
        />
      ))}
    </section>
  );
}
