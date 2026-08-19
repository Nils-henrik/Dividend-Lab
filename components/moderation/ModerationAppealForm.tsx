"use client";

import { useActionState } from "react";
import { submitModerationAppealAction } from "@/app/moderation/appeal/[actionId]/actions";
import type { ModerationAppealActionState } from "@/lib/moderation/types";

const initialState: ModerationAppealActionState = {
  status: "idle",
  message: "",
};

export default function ModerationAppealForm({ actionId }: { actionId: string }) {
  const boundAction = submitModerationAppealAction.bind(null, actionId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-xs font-medium text-divlab-text-muted">
        Varför bör beslutet omprövas?
        <textarea
          name="statement"
          minLength={20}
          maxLength={5000}
          rows={7}
          required
          placeholder="Beskriv vad du anser är fel i beslutet och vilken information du vill att DivLab tar hänsyn till vid omprövningen."
          className="divlab-input mt-1.5 w-full resize-y px-3 py-2.5 text-sm leading-6 text-divlab-text"
        />
      </label>

      {state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-lg border px-3 py-2 text-sm leading-6 ${state.status === "success" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-red-500/25 bg-red-500/10 text-red-300"}`}
        >
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending || state.status === "success"} className="divlab-btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
        {pending ? "Registrerar…" : "Begär omprövning"}
      </button>
    </form>
  );
}
