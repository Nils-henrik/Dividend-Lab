import type { ForumReaction } from "@/types/forum";

type Props = {
  recognitions: ForumReaction[];
};

export default function ForumRecognitionBar({ recognitions }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {recognitions.map((recognition) => (
        <button
          key={recognition.label}
          type="button"
          className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] leading-4 text-gray-400 transition hover:border-[#D4AF37]/30 hover:text-white"
          aria-label={`${recognition.label}: ${recognition.count}`}
        >
          <span aria-hidden="true">{recognition.icon}</span>{" "}
          <span className="tabular-nums">{recognition.count}</span>
          <span className="ml-1 text-gray-500">{recognition.label}</span>
        </button>
      ))}
    </div>
  );
}
