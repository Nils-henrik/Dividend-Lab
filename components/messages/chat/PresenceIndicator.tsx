import type { PresenceView } from "@/lib/messages/types";

type Props = {
  presence?: PresenceView | null;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
};

export default function PresenceIndicator({
  presence,
  size = "sm",
  showLabel = false,
  className = "",
}: Props) {
  if (!presence || presence.kind === "offline") {
    return null;
  }

  const dotSize = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {presence.kind === "online" ? (
        <span
          aria-hidden="true"
          className={`rounded-full bg-divlab-green ${dotSize}`}
        />
      ) : null}
      {showLabel && presence.compactLabel ? (
        <span className="text-[11px] text-divlab-text-muted">
          {presence.compactLabel}
        </span>
      ) : null}
      {presence.srLabel ? (
        <span className="sr-only">{presence.srLabel}</span>
      ) : null}
    </span>
  );
}