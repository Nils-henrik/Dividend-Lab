"use client";

import Link from "next/link";

type Props = {
  isAuthenticated: boolean;
  loginHref: string;
  onReply: () => void;
  onQuote: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
  reportHref?: string;
};

export default function ForumPostActionRow({
  isAuthenticated,
  loginHref,
  onReply,
  onQuote,
  canEdit = false,
  onEdit,
  reportHref,
}: Props) {
  const buttonClassName = "divlab-btn-ghost px-2 py-0.5 text-[11px]";

  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Link href={loginHref} className={buttonClassName}>
          Svara
        </Link>
        <Link href={loginHref} className={buttonClassName}>
          Citera
        </Link>
        {reportHref ? (
          <Link href={reportHref} className={buttonClassName}>
            Rapportera
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={onReply} className={buttonClassName}>
        Svara
      </button>
      <button type="button" onClick={onQuote} className={buttonClassName}>
        Citera
      </button>
      {canEdit && onEdit ? (
        <button type="button" onClick={onEdit} className={buttonClassName}>
          Redigera
        </button>
      ) : null}
      {reportHref ? (
        <Link href={reportHref} className={buttonClassName}>
          Rapportera
        </Link>
      ) : null}
    </div>
  );
}
