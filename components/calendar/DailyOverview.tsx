import type { DailyOverviewMetric } from "@/types/calendar";

type Props = {
  metrics: DailyOverviewMetric[];
};

export default function DailyOverview({ metrics }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
          Dagens portföljöversikt
        </p>
        <p className="text-xs text-gray-500">Det du behöver veta idag</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-white/10 bg-[#161616] px-4 py-4"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500">
              {metric.label}
            </p>
            <p className="mt-2 text-[1.75rem] font-medium leading-none text-white tabular-nums">
              {metric.value}
            </p>
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                {metric.nextLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {metric.nextCompany}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 tabular-nums">
                {metric.nextDetail}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
