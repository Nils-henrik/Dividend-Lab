import { portfolioEventService } from "@/lib/events";

export default function BrainSummaryPlaceholder() {
  const summary = portfolioEventService.getBrainSummary();

  return (
    <section
      aria-label="Dividend Brain daglig sammanfattning"
      className="divlab-card px-6 py-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="divlab-section-label text-[10px] tracking-[0.22em]">
            Dividend Brain
          </p>
          <h3 className="mt-2 text-base font-semibold text-divlab-text">
            Dagens portföljsammanfattning
          </h3>
        </div>
        <span className="shrink-0 rounded-full divlab-selected px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]">
          Förbereds
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-7 text-divlab-text-secondary">
        {summary}
      </p>

      <p className="mt-3 text-[11px] text-divlab-text-subtle">
        Dividend Brain kommer att sammanfatta dagens händelser till lugna,
        utbildande observationer. Ingen finansiell rådgivning.
      </p>
    </section>
  );
}
