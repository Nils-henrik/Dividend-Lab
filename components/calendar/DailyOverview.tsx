import type { DailyOverviewMetric } from "@/types/calendar";

type Props = {
  metrics: DailyOverviewMetric[];
};

export default function DailyOverview({ metrics }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="divlab-section-label text-[10px] tracking-[0.22em]">
          Dagens portföljöversikt
        </p>
        <p className="text-xs text-divlab-text-muted">Det du behöver veta idag</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="divlab-card px-4 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
              {metric.label}
            </p>
            <p className="mt-2 text-[1.75rem] font-medium leading-none text-divlab-text tabular-nums">
              {metric.value}
            </p>
            <div className="mt-4 border-t divlab-border-neutral pt-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-divlab-text-subtle">
                {metric.nextLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-divlab-text">
                {metric.nextCompany}
              </p>
              <p className="mt-0.5 text-xs text-divlab-text-muted tabular-nums">
                {metric.nextDetail}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
