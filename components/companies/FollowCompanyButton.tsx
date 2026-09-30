"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { setCompanyFollowAction } from "@/app/bolag/actions";
import FollowEventExplanation from "@/components/companies/FollowEventExplanation";
import {
  followButtonAriaLabel,
  followButtonLabel,
  type FollowButtonMode,
} from "@/lib/companies/follow-label";

type Props = {
  companySlug: string;
  companyName?: string;
  isAuthenticated: boolean;
  isAvailable: boolean;
  isFollowing: boolean;
  loginHref: string;
  mode?: FollowButtonMode;
};

function buttonClass(mode: FollowButtonMode, isFollowing: boolean) {
  if (mode === "page") {
    return "divlab-btn-primary w-full";
  }

  const tone =
    mode === "discovery" && !isFollowing
      ? "divlab-btn-primary"
      : "divlab-btn-secondary";

  return `${tone} min-h-11 shrink-0 px-3 py-2 text-xs`;
}

function SubmitButton({
  isFollowing,
  mode,
  companyName,
}: {
  isFollowing: boolean;
  mode: FollowButtonMode;
  companyName: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={isFollowing}
      aria-label={followButtonAriaLabel(companyName, isFollowing)}
      className={`${buttonClass(mode, isFollowing)} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 disabled:cursor-wait disabled:opacity-60`}
    >
      {followButtonLabel(isFollowing, mode, pending)}
    </button>
  );
}

export default function FollowCompanyButton({
  companySlug,
  companyName,
  isAuthenticated,
  isAvailable,
  isFollowing,
  loginHref,
  mode = "page",
}: Props) {
  const labelName = companyName?.trim() || companySlug;
  let control;

  if (!isAuthenticated) {
    control = (
      <Link
        href={loginHref}
        className={`${buttonClass(mode, false)} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50`}
      >
        {mode === "page" ? "+ Följ bolaget" : "Logga in för att följa"}
      </Link>
    );
  } else if (!isAvailable) {
    control = (
      <button
        type="button"
        disabled
        className={`${buttonClass(mode, false)} cursor-not-allowed opacity-60`}
      >
        Bevakning öppnar snart
      </button>
    );
  } else {
    control = (
      <form action={setCompanyFollowAction}>
        <input type="hidden" name="companySlug" value={companySlug} />
        <input type="hidden" name="follow" value={isFollowing ? "false" : "true"} />
        <SubmitButton isFollowing={isFollowing} mode={mode} companyName={labelName} />
      </form>
    );
  }

  if (mode !== "page") return control;

  return (
    <div className="w-full">
      {control}
      <FollowEventExplanation
        linkToMittDivlab
        className="mt-2 text-left text-xs leading-5 text-divlab-text-secondary"
      />
    </div>
  );
}
