import DividendBrainPanel from "@/components/brain/DividendBrainPanel";
import ForumPreview from "./ForumPreview";
import GoalsCard from "./GoalsCard";
import OverviewCards from "./OverviewCards";
import PortfolioGraph from "./PortfolioGraph";
import UpcomingDividends from "./UpcomingDividends";

export default function DashboardShell() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
              Today in Dividend Lab
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
              Build long-term dividend income with clarity.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
              See portfolio progress, AI observations, upcoming payouts and
              community discussions in one calm workspace.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.65)]" />
            Portfolio updated today
          </div>
        </div>
      </section>

      <OverviewCards />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PortfolioGraph />
        <DividendBrainPanel />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_0.7fr_0.85fr]">
        <UpcomingDividends />
        <GoalsCard />
        <ForumPreview />
      </section>
    </div>
  );
}
