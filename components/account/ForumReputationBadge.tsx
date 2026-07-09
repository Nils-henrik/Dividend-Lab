import { getForumReputationBadge } from "@/lib/forum/reputation-badge";

type Props = {
  totalReceivedReactions: number;
  showDescription?: boolean;
  className?: string;
};

export default function ForumReputationBadge({
  totalReceivedReactions,
  showDescription = false,
  className = "",
}: Props) {
  const badge = getForumReputationBadge(totalReceivedReactions);
  const isVeteran = badge.level === "dividend_lab_veteran";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.02em] ${
            isVeteran
              ? "border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]"
              : "border-white/10 bg-white/[0.03] text-gray-300"
          }`}
        >
          {badge.label}
        </span>
        <span className="text-xs text-gray-500">
          {badge.score}{" "}
          {badge.score === 1 ? "mottagen reaktion" : "mottagna reaktioner"}
        </span>
      </div>
      {showDescription && (
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
          {badge.description}
        </p>
      )}
    </div>
  );
}
