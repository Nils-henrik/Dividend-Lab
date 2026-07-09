"use client";

import Link from "next/link";

type Props = {
  isAuthenticated: boolean;
  loginHref: string;
  onReply: () => void;
  onQuote: () => void;
};

export default function ForumPostActionRow({
  isAuthenticated,
  loginHref,
  onReply,
  onQuote,
}: Props) {
  const buttonClassName =
    "rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]";

  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Link href={loginHref} className={buttonClassName}>
          Svara
        </Link>
        <Link href={loginHref} className={buttonClassName}>
          Citera
        </Link>
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
    </div>
  );
}
