"use client";

import { useState } from "react";
import { getForumCompanyInitials } from "@/lib/forum/companies/filters";

type Props = {
  name: string;
  logoPath?: string | null;
};

const LOGO_CONTAINER_CLASS =
  "h-[52px] w-24 sm:h-16 sm:w-32";
const INITIALS_CONTAINER_CLASS = "h-14 w-14";

export default function ForumCompanyAvatar({
  name,
  logoPath = null,
}: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showLogo = Boolean(logoPath) && logoPath !== failedUrl;
  const initials = getForumCompanyInitials(name);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] ${
        showLogo ? LOGO_CONTAINER_CLASS : INITIALS_CONTAINER_CLASS
      }`}
      aria-hidden="true"
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoPath ?? undefined}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain p-2"
          onError={() => setFailedUrl(logoPath)}
        />
      ) : (
        <span className="text-xs font-semibold text-divlab-text-secondary">
          {initials}
        </span>
      )}
    </span>
  );
}
