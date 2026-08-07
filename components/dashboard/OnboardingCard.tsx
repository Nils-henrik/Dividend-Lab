"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { UserProfile } from "@/lib/profiles/types";

const LEGACY_FORUM_VISITED_KEY = "divlab_onboarding_forum_visited";

type Props = {
  profile: UserProfile;
};

type Step = {
  id: string;
  label: string;
  href: string;
  completed: boolean;
};

function getProfileSteps(profile: UserProfile): Step[] {
  const hasProfileBasics = Boolean(
    profile.displayName?.trim() ||
      profile.bio?.trim() ||
      profile.favoriteSector?.trim(),
  );
  const hasUsername = Boolean(profile.username?.trim());
  const hasInvestorGoal = Boolean(profile.investorGoal?.trim());

  return [
    {
      id: "profile",
      label: "Slutför din profil",
      href: "/account/edit",
      completed: hasProfileBasics,
    },
    {
      id: "username",
      label: "Välj ditt @namn",
      href: "/account/edit",
      completed: hasUsername,
    },
    {
      id: "goal",
      label: "Sätt ditt utdelningsmål",
      href: "/account/edit",
      completed: hasInvestorGoal,
    },
  ];
}

export default function OnboardingCard({ profile }: Props) {
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_FORUM_VISITED_KEY);
    } catch {
      // Ignore cleanup failures in restricted storage contexts.
    }
  }, []);

  const steps = getProfileSteps(profile);
  const completedCount = steps.filter((step) => step.completed).length;
  const nextStep = steps.find((step) => !step.completed);

  if (!nextStep) {
    return null;
  }

  return (
    <Link
      href={nextStep.href}
      className="group flex flex-col gap-3 rounded-2xl border divlab-border-neutral divlab-inset px-4 py-4 transition hover:border-divlab-blue/30 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-divlab-blue-muted">Kom igång</span>
          <span className="text-divlab-text-subtle">·</span>
          <span className="text-divlab-text-muted tabular-nums">
            {completedCount} av {steps.length} klara
          </span>
        </div>
        <p className="mt-1.5 text-sm font-medium text-divlab-text">
          {nextStep.label}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium text-divlab-text-muted transition group-hover:text-divlab-blue-muted">
        Fortsätt →
      </span>
    </Link>
  );
}
