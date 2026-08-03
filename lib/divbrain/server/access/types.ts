/**
 * DivBrain Internal Alpha access contracts (Ticket 1A-8).
 *
 * Server-only. Must never be imported by client components.
 */

import type { DivBrainAccessGate, DivBrainActorResolver } from "../service/types";

/** Non-public server environment variable for Internal Alpha allowlist. */
export const DIVBRAIN_ALPHA_USER_IDS_ENV = "DIVBRAIN_ALPHA_USER_IDS" as const;

/**
 * Maximum allowlist entries accepted by the Phase 1A parser.
 * Internal Alpha starts as Henrik-only; the bound prevents oversized configs.
 */
export const DIVBRAIN_ALPHA_USER_IDS_MAX_ENTRIES = 16 as const;

/** Internal parse failures — never exposed to the browser. */
export type DivBrainAlphaAllowlistParseFailureReason =
  | "missing"
  | "empty"
  | "invalid_type"
  | "malformed_entry"
  | "too_many_entries";

export type DivBrainAlphaAllowlistParseResult =
  | {
      ok: true;
      /** Canonical lowercase UUID set — never mutate after gate creation. */
      userIds: ReadonlySet<string>;
    }
  | {
      ok: false;
      reason: DivBrainAlphaAllowlistParseFailureReason;
    };

export type DivBrainAlphaEnvironmentReader = () => string | undefined;

export type CreateDivBrainAlphaAccessGateOptions = {
  /** Injected raw configuration string (tests / explicit wiring). */
  rawUserIds?: string | undefined;
  /** Optional environment reader; defaults to process.env lookup at call time. */
  readEnvironment?: DivBrainAlphaEnvironmentReader;
};

export type CreateDivBrainSessionActorResolverOptions = {
  /**
   * Injected auth lookup for unit tests.
   * Production default uses `getAuthenticatedUser()` from the session layer.
   */
  getAuthenticatedUser?: () => Promise<{ id: string } | null>;
};

/** Presentation decision for `/brain` — never includes configured ids. */
export type DivBrainAlphaPageAccess =
  | { status: "unavailable" }
  | { status: "allowed_placeholder" };

export type DivBrainAlphaAccessModule = {
  actorResolver: DivBrainActorResolver;
  accessGate: DivBrainAccessGate;
};
