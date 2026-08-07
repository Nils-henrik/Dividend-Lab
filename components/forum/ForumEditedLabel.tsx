"use client";

import { formatForumEditedLabel } from "@/lib/forum/format";

type Props = {
  editedAt: string;
  onOpenHistory: () => void;
};

export default function ForumEditedLabel({ editedAt, onOpenHistory }: Props) {
  return (
    <button
      type="button"
      onClick={onOpenHistory}
      className="text-[11px] text-divlab-text-muted underline decoration-divlab-text-muted/40 underline-offset-2 transition hover:text-divlab-text focus:outline-none focus-visible:text-divlab-blue-muted"
      aria-label={`${formatForumEditedLabel(editedAt)}. Visa redigeringshistorik.`}
    >
      {formatForumEditedLabel(editedAt)}
    </button>
  );
}
