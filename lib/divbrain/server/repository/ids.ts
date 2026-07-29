/**
 * Deterministic identifier validation for DivBrain repository inputs.
 */

import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";

/** Accepts canonical UUID strings (any RFC 4122 version/variant). */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDivBrainUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function normalizeDivBrainActorId(
  actorId: unknown,
): DivBrainResult<string> {
  if (!isDivBrainUuid(actorId)) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(actorId.toLowerCase());
}

export function normalizeDivBrainResourceId(
  id: unknown,
): DivBrainResult<string> {
  if (!isDivBrainUuid(id)) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(id.toLowerCase());
}
