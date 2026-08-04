import Link from "next/link";
import {
  buildDivBrainHref,
  type DivBrainArchiveScope,
} from "@/lib/divbrain/brain-routes";

type Props = {
  archiveScope: DivBrainArchiveScope;
};

export default function DivBrainScopeSwitch({ archiveScope }: Props) {
  const activeHref = buildDivBrainHref({ archiveScope: "active" });
  const archivedHref = buildDivBrainHref({ archiveScope: "archived" });

  return (
    <div
      role="tablist"
      aria-label="Konversationsvy"
      className="mt-3 grid grid-cols-2 gap-1 rounded-xl border divlab-border-neutral bg-divlab-elevated/40 p-1"
    >
      <Link
        href={activeHref}
        role="tab"
        aria-selected={archiveScope === "active"}
        className={`inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-divlab-blue ${
          archiveScope === "active"
            ? "bg-divlab-surface text-divlab-text shadow-sm"
            : "text-divlab-text-muted hover:text-divlab-text"
        }`}
      >
        Aktiva
      </Link>
      <Link
        href={archivedHref}
        role="tab"
        aria-selected={archiveScope === "archived"}
        className={`inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-divlab-blue ${
          archiveScope === "archived"
            ? "bg-divlab-surface text-divlab-text shadow-sm"
            : "text-divlab-text-muted hover:text-divlab-text"
        }`}
      >
        Arkiverade
      </Link>
    </div>
  );
}
