/**
 * DivBrain application-service public surface (Ticket 1A-7b).
 *
 * Server-only by convention (`lib/divbrain/server/`). Must never be imported
 * by client components. Package-level `import "server-only"` remains deferred.
 *
 * Do not re-export this barrel from shared browser-safe `lib/divbrain/*`.
 */

export {
  createDivBrainApplicationService,
  createDivBrainApplicationServiceDeps,
} from "./service";

export {
  DIVBRAIN_HISTORY_MAX_PAGE_ROUNDS,
  isEligibleDivBrainHistoryMessage,
  loadBoundedDivBrainHistory,
  mapMessagesToContextHistoryTurns,
} from "./history";

export { parseDivBrainSubmitMessageInput } from "./input";

export {
  DIVBRAIN_APPLICATION_PROVIDER_TIMEOUT_MS_DEFAULT,
  type CreateDivBrainApplicationServiceDeps,
  type DivBrainAccessGate,
  type DivBrainActorResolver,
  type DivBrainApplicationService,
  type DivBrainContextAssembler,
  type DivBrainGuardrailEvaluator,
  type DivBrainProviderRequestMapper,
  type DivBrainSubmitMessageOptions,
  type DivBrainSubmitMessageOutcome,
} from "./types";
