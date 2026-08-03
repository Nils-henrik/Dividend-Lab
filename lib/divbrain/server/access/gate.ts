/**
 * Concrete DivBrain Internal Alpha access gate (Ticket 1A-8).
 *
 * Implements DivBrainAccessGate using DIVBRAIN_ALPHA_USER_IDS.
 * Fail-closed for missing/malformed configuration. Exact UUID match only.
 *
 * This module must never be imported by client components.
 */

import { createDivBrainError } from "../../errors";
import type { DivBrainResult } from "../../results";
import { divBrainFailure, divBrainSuccess } from "../../results";
import { isDivBrainUuid } from "../repository/ids";
import type { DivBrainAccessGate } from "../service/types";
import { parseDivBrainAlphaUserIds } from "./parse";
import {
  DIVBRAIN_ALPHA_USER_IDS_ENV,
  type CreateDivBrainAlphaAccessGateOptions,
  type DivBrainAlphaEnvironmentReader,
} from "./types";

function denied(): DivBrainResult<void> {
  return divBrainFailure(createDivBrainError("access_denied"));
}

function defaultReadEnvironment(): string | undefined {
  try {
    const value = process.env[DIVBRAIN_ALPHA_USER_IDS_ENV];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

function resolveRawConfiguration(
  options: CreateDivBrainAlphaAccessGateOptions,
): string | undefined {
  if (Object.prototype.hasOwnProperty.call(options, "rawUserIds")) {
    return options.rawUserIds;
  }

  const reader: DivBrainAlphaEnvironmentReader =
    options.readEnvironment ?? defaultReadEnvironment;
  return reader();
}

/**
 * Create an Alpha access gate from an injected raw config and/or env reader.
 *
 * Configuration is resolved when the factory runs (or via injected raw value),
 * not permanently captured at module-import time for the env default path —
 * `createDivBrainAlphaAccessGateFromEnvironment` re-reads env on each factory call.
 */
export function createDivBrainAlphaAccessGate(
  options: CreateDivBrainAlphaAccessGateOptions = {},
): DivBrainAccessGate {
  let allowlist: ReadonlySet<string> | null = null;

  try {
    const raw = resolveRawConfiguration(options);
    const parsed = parseDivBrainAlphaUserIds(raw);
    if (parsed.ok) {
      allowlist = parsed.userIds;
    }
  } catch {
    allowlist = null;
  }

  const gate: DivBrainAccessGate = {
    async checkAccess(actorId) {
      try {
        if (allowlist === null) {
          return denied();
        }

        if (!isDivBrainUuid(actorId)) {
          return denied();
        }

        const normalized = actorId.toLowerCase();
        if (!allowlist.has(normalized)) {
          return denied();
        }

        return divBrainSuccess(undefined);
      } catch {
        return denied();
      }
    },
  };

  return Object.freeze(gate);
}

/**
 * Create an Alpha access gate that reads DIVBRAIN_ALPHA_USER_IDS from the
 * environment at factory-creation time (not at module import).
 */
export function createDivBrainAlphaAccessGateFromEnvironment(
  readEnvironment: DivBrainAlphaEnvironmentReader = defaultReadEnvironment,
): DivBrainAccessGate {
  return createDivBrainAlphaAccessGate({ readEnvironment });
}
