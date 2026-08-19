"use client";

import { useActionState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { decideModerationReportAction } from "@/app/moderation/actions";
import {
  MODERATION_ACTION_LABELS,
  isActionAllowedForTarget,
} from "@/lib/moderation/config";
import {
  MODERATION_ACTION_TYPES,
  type ContentReportTargetType,
  type ModerationDecisionActionState,
} from "@/lib/moderation/types";

const initialState: ModerationDecisionActionState = {
  status: "idle",
  message: "",
};

type Props = {
  reportId: string;
  targetType: ContentReportTargetType;
};

export default function ModerationDecisionForm({ reportId, targetType }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (previousState: ModerationDecisionActionState, formData: FormData) => {
      const result = await decideModerationReportAction(previousState, formData);
      if (result.status === "success") router.refresh();
      return result;
    },
    initialState,
  );

  const allowedActions = useMemo(
    () => MODERATION_ACTION_TYPES.filter((action) => isActionAllowedForTarget(action, targetType)),
    [targetType],
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="reportId" value={reportId} />

      <label className="block text-xs font-medium text-divlab-text-muted">
        Beslut
        <select name="actionType" required className="divlab-input mt-1.5 w-full px-3 py-2.5 text-sm text-divlab-text">
          {allowedActions.map((action) => (
            <option key={action} value={action}>
              {MODERATION_ACTION_LABELS[action]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-divlab-text-muted">
        Grund för beslutet
        <select name="basisType" required defaultValue="terms" className="divlab-input mt-1.5 w-full px-3 py-2.5 text-sm text-divlab-text">
          <option value="terms">DivLabs användarvillkor</option>
          <option value="law">Lag</option>
          <option value="both">Lag och DivLabs användarvillkor</option>
          <option value="none">Ingen begränsning / ingen överträdelse fastställd</option>
        </select>
      </label>

      <label className="block text-xs font-medium text-divlab-text-muted">
        Rättslig grund (krävs om beslutet bygger på lag)
        <textarea
          name="legalBasis"
          rows={3}
          maxLength={1500}
          placeholder="Ange relevant lag eller rättslig grund så konkret som möjligt."
          className="divlab-input mt-1.5 w-full resize-y px-3 py-2.5 text-sm leading-6 text-divlab-text"
        />
      </label>

      <label className="block text-xs font-medium text-divlab-text-muted">
        Regel i DivLabs villkor (krävs om beslutet bygger på villkoren)
        <textarea
          name="termsBasis"
          rows={3}
          maxLength={1500}
          placeholder="Exempel: Användargenererat innehåll – marknadsmanipulation eller vilseledande påståenden."
          className="divlab-input mt-1.5 w-full resize-y px-3 py-2.5 text-sm leading-6 text-divlab-text"
        />
      </label>

      <label className="block text-xs font-medium text-divlab-text-muted">
        Faktiska skäl för beslutet
        <textarea
          name="factualReason"
          rows={6}
          minLength={20}
          maxLength={5000}
          required
          placeholder="Beskriv konkret vilka omständigheter i det anmälda innehållet som ligger bakom beslutet. Denna text används i beslutskommunikationen."
          className="divlab-input mt-1.5 w-full resize-y px-3 py-2.5 text-sm leading-6 text-divlab-text"
        />
      </label>

      <label className="block text-xs font-medium text-divlab-text-muted">
        Begränsning gäller till (valfritt)
        <input
          type="datetime-local"
          name="effectiveUntil"
          className="divlab-input mt-1.5 w-full px-3 py-2.5 text-sm text-divlab-text"
        />
      </label>

      <div className="rounded-xl border divlab-border-neutral divlab-inset p-4">
        <label className="flex items-start gap-3 text-sm text-divlab-text-secondary">
          <input type="checkbox" name="automated" className="mt-1" />
          <span>Automatiserade verktyg användes för att fatta eller väsentligt påverka detta beslut.</span>
        </label>
        <label className="mt-3 block text-xs font-medium text-divlab-text-muted">
          Beskriv automatiseringen om rutan ovan markeras
          <textarea
            name="automationDetails"
            rows={2}
            maxLength={1000}
            className="divlab-input mt-1.5 w-full resize-y px-3 py-2.5 text-sm leading-6 text-divlab-text"
          />
        </label>
      </div>

      {state.status !== "idle" ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm leading-6 ${state.status === "success" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-red-500/25 bg-red-500/10 text-red-300"}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="divlab-btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
        {pending ? "Genomför beslut…" : "Genomför och logga beslut"}
      </button>
    </form>
  );
}
