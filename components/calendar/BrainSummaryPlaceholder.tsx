import { portfolioEventService } from "@/lib/events";

export default function BrainSummaryPlaceholder() {
  const summary = portfolioEventService.getBrainSummary();

  return (
    <section
      aria-label="Dividend Brain daily summary"
      className="rounded-2xl border border-[#D4AF37]/20 bg-[#161616] px-6 py-5 shadow-[0_0_40px_rgba(212,175,55,0.04)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
            Dividend Brain
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">
            Today&apos;s portfolio summary
          </h3>
        </div>
        <span className="shrink-0 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#D4AF37]">
          Preparing
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-7 text-gray-300">{summary}</p>

      <p className="mt-3 text-[11px] text-gray-600">
        Dividend Brain will synthesize daily events into calm, educational
        observations. No financial advice.
      </p>
    </section>
  );
}
