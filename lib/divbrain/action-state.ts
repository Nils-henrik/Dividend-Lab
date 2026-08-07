/**
 * Browser-safe DivBrain server-action result contract (Ticket 1A-9b).
 *
 * Shared by server actions and client composers.
 * Must never include actor/owner ids, prompt content, raw errors, or secrets.
 */

export type DivBrainActionStatus =
  | "idle"
  | "success"
  | "error"
  | "blocked"
  | "provider_unavailable"
  | "failed"
  | "cancelled";

/**
 * Fixed safe action state returned to client components.
 * `safeMessage` is catalog/Swedish UI copy only — never the user prompt.
 */
export type DivBrainActionState = {
  status: DivBrainActionStatus;
  safeMessage: string | null;
  persisted: boolean;
  clearComposer: boolean;
};

export const DIVBRAIN_ACTION_STATE_IDLE: DivBrainActionState = {
  status: "idle",
  safeMessage: null,
  persisted: false,
  clearComposer: false,
};

export function createDivBrainActionState(
  partial: Partial<DivBrainActionState> & Pick<DivBrainActionState, "status">,
): DivBrainActionState {
  return {
    status: partial.status,
    safeMessage:
      typeof partial.safeMessage === "string" ? partial.safeMessage : null,
    persisted: Boolean(partial.persisted),
    clearComposer: Boolean(partial.clearComposer),
  };
}
