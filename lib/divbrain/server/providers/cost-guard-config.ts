/**
 * Server-only DivBrain Cost Guard configuration (Issue #103).
 *
 * Runtime thresholds are explicit USD micro-unit integers. Founder SEK policy
 * (200 target / 300 warning / 400 hard stop) is mapped deliberately at
 * activation time — never via a hard-coded FX rate in this module.
 *
 * Fail closed: missing, malformed, negative, non-finite, or inconsistent
 * config is rejected.
 *
 * This module must never be imported by client components.
 * Do not mutate process.env from this module.
 */

import { isDivBrainMicroUsd, type DivBrainMicroUsd } from "./cost-units";

export const DIVBRAIN_COST_GUARD_CONFIG_KIND_VALID = "valid" as const;
export const DIVBRAIN_COST_GUARD_CONFIG_KIND_INVALID = "invalid" as const;

export type DivBrainCostGuardConfigReason =
  | "missing"
  | "malformed"
  | "non_positive"
  | "inconsistent";

export type DivBrainCostGuardConfig =
  | {
      kind: typeof DIVBRAIN_COST_GUARD_CONFIG_KIND_VALID;
      /** Hard per-request projected-cost ceiling (micro-USD). */
      maxRequestMicroUsd: DivBrainMicroUsd;
      /** UTC-day hard stop (micro-USD). */
      dailyHardLimitMicroUsd: DivBrainMicroUsd;
      /** Monthly normal/target level (micro-USD). Observability only. */
      monthlyTargetMicroUsd: DivBrainMicroUsd;
      /** Monthly warning/review level (micro-USD). Observability only. */
      monthlyWarningMicroUsd: DivBrainMicroUsd;
      /** Monthly hard stop (micro-USD). Enforced pre-flight. */
      monthlyHardLimitMicroUsd: DivBrainMicroUsd;
    }
  | {
      kind: typeof DIVBRAIN_COST_GUARD_CONFIG_KIND_INVALID;
      reason: DivBrainCostGuardConfigReason;
    };

export type DivBrainCostGuardEnvSource = {
  readonly DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD?: string;
  readonly DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD?: string;
  readonly DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD?: string;
  readonly DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD?: string;
  readonly DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD?: string;
};

function readTrimmed(
  source: DivBrainCostGuardEnvSource,
  key: keyof DivBrainCostGuardEnvSource,
): string | undefined {
  const value = source[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePositiveMicroUsd(
  raw: string | undefined,
): DivBrainMicroUsd | null {
  if (raw === undefined) {
    return null;
  }

  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!isDivBrainMicroUsd(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Parse Cost Guard thresholds from a server env-like object.
 * Incomplete or inconsistent values fail closed to `invalid`.
 */
export function parseDivBrainCostGuardConfig(
  source: DivBrainCostGuardEnvSource = {},
): DivBrainCostGuardConfig {
  const rawMax = readTrimmed(
    source,
    "DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD",
  );
  const rawDaily = readTrimmed(
    source,
    "DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD",
  );
  const rawTarget = readTrimmed(
    source,
    "DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD",
  );
  const rawWarning = readTrimmed(
    source,
    "DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD",
  );
  const rawMonthly = readTrimmed(
    source,
    "DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD",
  );

  const anyPresent =
    rawMax !== undefined ||
    rawDaily !== undefined ||
    rawTarget !== undefined ||
    rawWarning !== undefined ||
    rawMonthly !== undefined;

  if (!anyPresent) {
    return {
      kind: DIVBRAIN_COST_GUARD_CONFIG_KIND_INVALID,
      reason: "missing",
    };
  }

  if (
    rawMax === undefined ||
    rawDaily === undefined ||
    rawTarget === undefined ||
    rawWarning === undefined ||
    rawMonthly === undefined
  ) {
    return {
      kind: DIVBRAIN_COST_GUARD_CONFIG_KIND_INVALID,
      reason: "malformed",
    };
  }

  const maxRequestMicroUsd = parsePositiveMicroUsd(rawMax);
  const dailyHardLimitMicroUsd = parsePositiveMicroUsd(rawDaily);
  const monthlyTargetMicroUsd = parsePositiveMicroUsd(rawTarget);
  const monthlyWarningMicroUsd = parsePositiveMicroUsd(rawWarning);
  const monthlyHardLimitMicroUsd = parsePositiveMicroUsd(rawMonthly);

  if (
    maxRequestMicroUsd === null ||
    dailyHardLimitMicroUsd === null ||
    monthlyTargetMicroUsd === null ||
    monthlyWarningMicroUsd === null ||
    monthlyHardLimitMicroUsd === null
  ) {
    return {
      kind: DIVBRAIN_COST_GUARD_CONFIG_KIND_INVALID,
      reason: "non_positive",
    };
  }

  // Internal consistency: request ≤ day ≤ month hard;
  // target ≤ warning ≤ monthly hard.
  if (
    maxRequestMicroUsd > dailyHardLimitMicroUsd ||
    dailyHardLimitMicroUsd > monthlyHardLimitMicroUsd ||
    monthlyTargetMicroUsd > monthlyWarningMicroUsd ||
    monthlyWarningMicroUsd > monthlyHardLimitMicroUsd
  ) {
    return {
      kind: DIVBRAIN_COST_GUARD_CONFIG_KIND_INVALID,
      reason: "inconsistent",
    };
  }

  return {
    kind: DIVBRAIN_COST_GUARD_CONFIG_KIND_VALID,
    maxRequestMicroUsd,
    dailyHardLimitMicroUsd,
    monthlyTargetMicroUsd,
    monthlyWarningMicroUsd,
    monthlyHardLimitMicroUsd,
  };
}

/** Read Cost Guard config from `process.env` without mutating it. */
export function readDivBrainCostGuardConfigFromEnv(): DivBrainCostGuardConfig {
  return parseDivBrainCostGuardConfig({
    DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD:
      process.env.DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD,
    DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD:
      process.env.DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD,
    DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD:
      process.env.DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD,
    DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD:
      process.env.DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD,
    DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD:
      process.env.DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD,
  });
}

export function isValidDivBrainCostGuardConfig(
  config: DivBrainCostGuardConfig,
): config is Extract<
  DivBrainCostGuardConfig,
  { kind: typeof DIVBRAIN_COST_GUARD_CONFIG_KIND_VALID }
> {
  return config.kind === DIVBRAIN_COST_GUARD_CONFIG_KIND_VALID;
}
