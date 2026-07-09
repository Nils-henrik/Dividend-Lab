import type { TodaysHighlight } from "@/types/calendar";

type Props = {
  highlight: TodaysHighlight;
};

export default function TodaysHighlight({ highlight }: Props) {
  return (
    <article className="divlab-card px-6 py-5">
      <p className="divlab-section-label text-[10px] tracking-[0.22em]">
        Dagens höjdpunkt
      </p>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xl font-semibold tracking-[-0.02em] text-divlab-text">
            {highlight.company}
          </p>
          <p className="mt-1 text-sm text-divlab-text-secondary">{highlight.headline}</p>
        </div>

        <div className="flex items-center gap-5">
          <p className="text-2xl font-medium text-divlab-green tabular-nums">
            {highlight.metric}
          </p>
          <button
            type="button"
            className="divlab-link text-sm font-medium"
          >
            {highlight.ctaLabel} →
          </button>
        </div>
      </div>
    </article>
  );
}
