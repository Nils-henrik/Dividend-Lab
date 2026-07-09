import type { TodaysHighlight } from "@/types/calendar";

type Props = {
  highlight: TodaysHighlight;
};

export default function TodaysHighlight({ highlight }: Props) {
  return (
    <article className="rounded-2xl border border-[#D4AF37]/20 bg-[#161616] px-6 py-5 shadow-[0_0_36px_rgba(212,175,55,0.05)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
        Dagens höjdpunkt
      </p>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xl font-semibold tracking-[-0.02em] text-white">
            {highlight.company}
          </p>
          <p className="mt-1 text-sm text-gray-400">{highlight.headline}</p>
        </div>

        <div className="flex items-center gap-5">
          <p className="text-2xl font-medium text-green-400 tabular-nums">
            {highlight.metric}
          </p>
          <button
            type="button"
            className="text-sm font-medium text-[#D4AF37] transition-colors duration-300 hover:text-[#F9D976]"
          >
            {highlight.ctaLabel} →
          </button>
        </div>
      </div>
    </article>
  );
}
