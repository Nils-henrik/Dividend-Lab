"use client";

import Link from "next/link";
import { useActionState } from "react";
import { moderateTargetDirectlyAction } from "@/app/moderation/actions";
import type {
  ContentReportTargetType,
  ModerationActionType,
  ModerationDecisionActionState,
} from "@/lib/moderation/types";

const initialState: ModerationDecisionActionState = {
  status: "idle",
  message: "",
};

type Props = {
  targetType: ContentReportTargetType;
  targetId: string;
  targetLabel: string;
  targetUrl: string;
};

type ActionOption = {
  value: ModerationActionType;
  label: string;
  description: string;
};

function getActionOptions(targetType: ContentReportTargetType): ActionOption[] {
  if (["forum_thread", "forum_reply", "learning_comment"].includes(targetType)) {
    return [
      {
        value: "hide_content",
        label: "Dölj innehåll",
        description: "Försvinner från publika ytor men bevaras i revisionsspåret.",
      },
      {
        value: "remove_content",
        label: "Ta bort innehåll",
        description: "Markeras som borttaget från publika ytor och bevaras för revision.",
      },
      {
        value: "warn_user",
        label: "Varna användaren",
        description: "Innehållet ligger kvar men ett modereringsbeslut registreras.",
      },
    ];
  }

  if (targetType === "profile") {
    return [
      {
        value: "clear_profile_bio",
        label: "Ta bort profiltext",
        description: "Rensar den publika biografin och sparar beslutet i revisionsloggen.",
      },
      {
        value: "remove_profile_avatar",
        label: "Ta bort profilbild",
        description: "Tar bort den publika profilbilden.",
      },
      {
        value: "warn_user",
        label: "Varna användaren",
        description: "Profilen lämnas oförändrad men beslutet registreras.",
      },
    ];
  }

  return [
    {
      value: "remove_profile_avatar",
      label: "Ta bort profilbild",
      description: "Tar bort den publika profilbilden.",
    },
    {
      value: "warn_user",
      label: "Varna användaren",
      description: "Profilbilden lämnas oförändrad men beslutet registreras.",
    },
  ];
}

export default function DirectModerationForm({
  targetType,
  targetId,
  targetLabel,
  targetUrl,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    moderateTargetDirectlyAction,
    initialState,
  );
  const actions = getActionOptions(targetType);

  if (state.status === "success") {
    return (
      <section className="divlab-card p-5 sm:p-6">
        <p className="text-sm font-medium text-emerald-300">Åtgärden är genomförd</p>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          {state.message}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={targetUrl} className="divlab-btn-primary px-4 py-2 text-sm">
            Tillbaka till innehållet
          </Link>
          <Link href="/moderation" className="divlab-btn-ghost px-4 py-2 text-sm">
            Öppna moderationskön
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form action={formAction} className="divlab-card space-y-5 p-5 sm:p-6">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />

      <div>
        <p className="divlab-section-label text-[11px]">Berört innehåll</p>
        <p className="mt-2 text-sm font-medium text-divlab-text">{targetLabel}</p>
        <Link
          href={targetUrl}
          className="mt-1 block break-all text-xs text-divlab-blue-muted hover:text-divlab-blue"
        >
          {targetUrl}
        </Link>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-divlab-text">Åtgärd</legend>
        <div className="mt-3 space-y-2">
          {actions.map((option, index) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-xl border divlab-border-neutral p-3 transition hover:border-amber-500/35"
            >
              <input
                type="radio"
                name="actionType"
                value={option.value}
                defaultChecked={index === 0}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-divlab-text">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-divlab-text-muted">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="direct-moderation-reason" className="text-sm font-medium text-divlab-text">
          Motivering
        </label>
        <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
          Skriv skälet som användaren ska kunna förstå. Detta sparas i revisionsloggen och används i beslutet som skickas till berörd användare.
        </p>
        <textarea
          id="direct-moderation-reason"
          name="factualReason"
          required
          minLength={20}
          maxLength={5000}
          rows={5}
          className="mt-2 w-full resize-y divlab-input px-3 py-2 text-sm leading-6"
          placeholder="Exempel: Inlägget innehåller upprepade personangrepp och bryter mot DivLabs communityregler."
        />
      </div>

      <label className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs leading-5 text-divlab-text-secondary">
        <input type="checkbox" name="confirm" required className="mt-0.5" />
        <span>
          Jag bekräftar att detta är ett modereringsbeslut. Åtgärden och motiveringen kommer att sparas i DivLabs revisionsspår.
        </span>
      </label>

      {state.status === "error" ? (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl border border-red-700 bg-red-600 px-4 py-2 text-sm font-semibold text-black transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Genomför..." : "Genomför moderering"}
        </button>
        <Link href={targetUrl} className="divlab-btn-ghost px-4 py-2 text-sm">
          Avbryt
        </Link>
      </div>
    </form>
  );
}
