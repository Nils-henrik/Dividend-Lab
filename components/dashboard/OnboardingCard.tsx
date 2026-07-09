"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  hasVisitedForum,
  markForumVisited,
  subscribeForumVisited,
} from "@/lib/onboarding/forum-visited";
import type { UserProfile } from "@/lib/profiles/types";

type Props = {
  profile: UserProfile;
};

type Step = {
  id: string;
  label: string;
  description: string;
  href: string;
  completed: boolean;
  isForumStep?: boolean;
};

function getProfileSteps(profile: UserProfile, forumVisited: boolean): Step[] {
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
      description: "Visa vem du är som investerare.",
      href: "/account/edit",
      completed: hasProfileBasics,
    },
    {
      id: "username",
      label: "Välj ditt @namn",
      description: "Krävs för att skriva i forumet.",
      href: "/account/edit",
      completed: hasUsername,
    },
    {
      id: "goal",
      label: "Sätt ditt utdelningsmål",
      description: "Formulera vad du bygger mot.",
      href: "/account/edit",
      completed: hasInvestorGoal,
    },
    {
      id: "forum",
      label: "Utforska forumet",
      description: "Läs diskussioner i din egen takt.",
      href: "/forum",
      completed: forumVisited,
      isForumStep: true,
    },
  ];
}

export default function OnboardingCard({ profile }: Props) {
  const forumVisited = useSyncExternalStore(
    subscribeForumVisited,
    hasVisitedForum,
    () => false,
  );

  const steps = getProfileSteps(profile, forumVisited);

  if (steps.every((step) => step.completed)) {
    return null;
  }

  const forumReady = Boolean(profile.username?.trim());

  function handleForumStepClick() {
    markForumVisited();
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        Nästa steg
      </p>
      <h2 className="text-lg font-semibold text-white">Kom igång i DivLab</h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">
        Ett färdigt konto och @namn behövs för att skriva i forumet. Allt annat
        kan du ta i din egen takt.
      </p>

      <div className="mt-5 space-y-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            onClick={step.isForumStep ? handleForumStepClick : undefined}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-[#D4AF37]/30 hover:bg-white/[0.05]"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium ${
                step.completed
                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "border-white/10 text-gray-500"
              }`}
            >
              {step.completed ? "✓" : ""}
            </span>
            <span>
              <span className="block text-sm font-medium text-white">
                {step.label}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-gray-500">
                {step.description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-5 text-xs leading-5 text-gray-500">
        {forumReady
          ? "Ditt @namn är klart. Du kan skriva i forumet när du känner dig redo."
          : "Välj ett @namn i profilen innan du skapar trådar eller svarar i forumet."}
      </p>
    </section>
  );
}
