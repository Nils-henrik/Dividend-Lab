import type { VisibilityState } from "@/data/account";

type Props = {
  visibility: VisibilityState;
};

const visibilityStyles: Record<VisibilityState, string> = {
  Public: "border-green-400/20 bg-green-400/10 text-green-400",
  Friends: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
  Private: "border-white/10 bg-white/[0.03] text-gray-400",
};

const visibilityLabels: Record<VisibilityState, string> = {
  Public: "Offentlig",
  Friends: "Vänner",
  Private: "Privat",
};

export default function VisibilityBadge({ visibility }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${visibilityStyles[visibility]}`}
    >
      {visibilityLabels[visibility]}
    </span>
  );
}
