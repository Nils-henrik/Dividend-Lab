import Link from "next/link";
import type { ForumReaction } from "@/types/forum";

type Props = {
  recognitions: ForumReaction[];
  isAuthenticated?: boolean;
  loginHref?: string;
};

export default function ForumRecognitionBar({
  recognitions,
  isAuthenticated = true,
  loginHref = "/login?redirect=/forum",
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {recognitions.map((recognition) => (
        isAuthenticated ? (
          <button
            key={recognition.label}
            type="button"
            className="rounded border border-divlab-border-neutral bg-white/[0.03] px-1.5 py-0.5 text-[10px] leading-4 text-divlab-text-muted transition hover:border-divlab-blue/30 hover:text-divlab-text"
            aria-label={`${recognition.label}: ${recognition.count}`}
          >
            <span aria-hidden="true">{recognition.icon}</span>{" "}
            <span className="tabular-nums">{recognition.count}</span>
            <span className="ml-1 text-gray-500">{recognition.label}</span>
          </button>
        ) : (
          <span
            key={recognition.label}
            className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] leading-4 text-gray-500"
            aria-label={`${recognition.label}: ${recognition.count}`}
          >
            <span aria-hidden="true">{recognition.icon}</span>{" "}
            <span className="tabular-nums">{recognition.count}</span>
            <span className="ml-1 text-gray-600">{recognition.label}</span>
          </span>
        )
      ))}
      {!isAuthenticated && (
        <Link
          href={loginHref}
          className="divlab-link ml-1 text-[10px] font-medium"
        >
          Logga in för att delta i diskussionen.
        </Link>
      )}
    </div>
  );
}
