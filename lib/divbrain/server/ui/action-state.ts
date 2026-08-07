/**
 * Server re-export of the browser-safe action-state contract.
 *
 * Prefer importing from `lib/divbrain/action-state` in client components.
 */

export {
  DIVBRAIN_ACTION_STATE_IDLE,
  createDivBrainActionState,
  type DivBrainActionState,
  type DivBrainActionStatus,
} from "../../action-state";
