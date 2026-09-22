"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { setCompanyFollowAction } from "@/app/bolag/actions";

type Props = {
  companySlug: string;
  isAuthenticated: boolean;
  isAvailable: boolean;
  isFollowing: boolean;
  loginHref: string;
  compact?: boolean;
};

function SubmitButton({
  isFollowing,
  compact,
}: {
  isFollowing: boolean;
  compact: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${
        compact ? "divlab-btn-secondary px-3 py-2 text-xs" : "divlab-btn-primary w-full"
      } disabled:cursor-wait disabled:opacity-60`}
    >
      {pending
        ? "Sparar…"
        : isFollowing
          ? compact
            ? "Sluta följ"
            : "Följer ✓"
          : "+ Följ bolaget"}
    </button>
  );
}

export default function FollowCompanyButton({
  companySlug,
  isAuthenticated,
  isAvailable,
  isFollowing,
  loginHref,
  compact = false,
}: Props) {
  if (!isAuthenticated) {
    return (
      <Link
        href={loginHref}
        className={compact ? "divlab-btn-secondary px-3 py-2 text-xs" : "divlab-btn-primary w-full"}
      >
        {compact ? "Logga in för att följa" : "+ Följ bolaget"}
      </Link>
    );
  }

  if (!isAvailable) {
    return (
      <button
        type="button"
        disabled
        className={`${
          compact ? "divlab-btn-secondary px-3 py-2 text-xs" : "divlab-btn-primary w-full"
        } cursor-not-allowed opacity-60`}
      >
        Bevakning öppnar snart
      </button>
    );
  }

  return (
    <form action={setCompanyFollowAction}>
      <input type="hidden" name="companySlug" value={companySlug} />
      <input type="hidden" name="follow" value={isFollowing ? "false" : "true"} />
      <SubmitButton isFollowing={isFollowing} compact={compact} />
    </form>
  );
}

