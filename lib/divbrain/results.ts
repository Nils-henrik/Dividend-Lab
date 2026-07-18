/**
 * DivBrain Result type for future server operations.
 * Success carries typed data; failure carries only a safe DivBrainError.
 */

import {
  createDivBrainError,
  toSafeDivBrainError,
  type DivBrainError,
  type DivBrainErrorCode,
} from "./errors";

export type DivBrainSuccess<T> = {
  ok: true;
  data: T;
};

export type DivBrainFailure = {
  ok: false;
  error: DivBrainError;
};

export type DivBrainResult<T> = DivBrainSuccess<T> | DivBrainFailure;

export function divBrainSuccess<T>(data: T): DivBrainSuccess<T> {
  return { ok: true, data };
}

export function divBrainFailure(error: DivBrainError): DivBrainFailure {
  return {
    ok: false,
    error: createDivBrainError(error.code),
  };
}

export function divBrainFailureFromCode(
  code: DivBrainErrorCode,
): DivBrainFailure {
  return divBrainFailure(createDivBrainError(code));
}

/** Convert an unknown thrown value into a safe failure result. */
export function divBrainFailureFromUnknown(error: unknown): DivBrainFailure {
  return divBrainFailure(toSafeDivBrainError(error));
}

export function isDivBrainSuccess<T>(
  result: DivBrainResult<T>,
): result is DivBrainSuccess<T> {
  return result.ok === true;
}

export function isDivBrainFailure<T>(
  result: DivBrainResult<T>,
): result is DivBrainFailure {
  return result.ok === false;
}
