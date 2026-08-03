/**
 * DivBrain Internal Alpha access public surface (Ticket 1A-8).
 *
 * Server-only by convention (`lib/divbrain/server/`). Must never be imported
 * by client components. Do not re-export from shared browser-safe barrels.
 */

export {
  createDivBrainSessionActorResolver,
} from "./actor-resolver";

export {
  createDivBrainAlphaAccessGate,
  createDivBrainAlphaAccessGateFromEnvironment,
} from "./gate";

export { parseDivBrainAlphaUserIds } from "./parse";

export { resolveDivBrainAlphaPageAccess } from "./page-access";

export {
  createDivBrainAlphaAccessModule,
  createDivBrainAlphaApplicationService,
  createDivBrainAlphaApplicationServiceDeps,
} from "./wiring";

export {
  DIVBRAIN_ALPHA_USER_IDS_ENV,
  DIVBRAIN_ALPHA_USER_IDS_MAX_ENTRIES,
  type CreateDivBrainAlphaAccessGateOptions,
  type CreateDivBrainSessionActorResolverOptions,
  type DivBrainAlphaAccessModule,
  type DivBrainAlphaAllowlistParseFailureReason,
  type DivBrainAlphaAllowlistParseResult,
  type DivBrainAlphaEnvironmentReader,
  type DivBrainAlphaPageAccess,
} from "./types";
