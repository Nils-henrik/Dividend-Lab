import "server-only";

import { unstable_cache } from "next/cache";

import {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
  FI_SHORT_INTEREST_REVALIDATE_SECONDS,
} from "@/lib/companies/short-interest/constants";
import { fetchFiOds, isTransientFiFetchError } from "@/lib/companies/short-interest/fetch";
import { parseFiShortInterestOds } from "@/lib/companies/short-interest/parse";
import type { FiShortInterestRegister } from "@/lib/companies/short-interest/types";

class FiShortInterestTransientError extends Error {
  constructor() {
    super("fi_short_interest_transient");
    this.name = "FiShortInterestTransientError";
  }
}

async function loadRegister(): Promise<FiShortInterestRegister | null> {
  const [aggregate, currentPositions] = await Promise.all([
    fetchFiOds(FI_AGGREGATE_ODS_URL),
    fetchFiOds(FI_CURRENT_POSITIONS_ODS_URL),
  ]);
  if (isTransientFiFetchError(aggregate) || isTransientFiFetchError(currentPositions)) {
    throw new FiShortInterestTransientError();
  }
  if (aggregate.status !== "ok" || currentPositions.status !== "ok") return null;
  return parseFiShortInterestOds({
    aggregate: aggregate.bytes,
    currentPositions: currentPositions.bytes,
    fetchedAt: new Date().toISOString(),
  });
}

const loadCachedRegister = unstable_cache(loadRegister, ["fi-short-interest-register-v1"], {
  revalidate: FI_SHORT_INTEREST_REVALIDATE_SECONDS,
});

/**
 * Cached read of FI's current aggregate file and current named-position file.
 * Transport failures are not cached. A schema failure is cached as unavailable
 * so a drifted file is not requested on every render. Historic positions are
 * intentionally not fetched.
 */
export async function loadFiShortInterestRegister(): Promise<FiShortInterestRegister | null> {
  try {
    return await loadCachedRegister();
  } catch (error) {
    if (
      error instanceof FiShortInterestTransientError
      || (error instanceof Error && (
        error.name === "FiShortInterestTransientError"
        || error.message === "fi_short_interest_transient"
      ))
    ) {
      return null;
    }
    throw error;
  }
}
