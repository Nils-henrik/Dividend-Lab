import {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
} from "@/lib/companies/short-interest/constants";
import { fetchFiOds, isTransientFiFetchError } from "@/lib/companies/short-interest/fetch";
import { parseFiShortInterestOds } from "@/lib/companies/short-interest/parse";
import type { FiRegisterRead } from "@/lib/companies/short-interest/cache";

/**
 * One uncached read of the two current FI files.
 * Transient transport failures stay distinct from a durable unavailable snapshot.
 * Historic position files are not requested.
 */
export async function readFiShortInterestOnce(options?: {
  fetchImpl?: typeof fetch;
  fetchedAt?: string | null;
}): Promise<FiRegisterRead> {
  const [aggregate, currentPositions] = await Promise.all([
    fetchFiOds(FI_AGGREGATE_ODS_URL, { fetchImpl: options?.fetchImpl }),
    fetchFiOds(FI_CURRENT_POSITIONS_ODS_URL, { fetchImpl: options?.fetchImpl }),
  ]);
  if (isTransientFiFetchError(aggregate) || isTransientFiFetchError(currentPositions)) {
    return { outcome: "transient" };
  }
  if (aggregate.status !== "ok" || currentPositions.status !== "ok") {
    return { outcome: "unavailable" };
  }
  const register = parseFiShortInterestOds({
    aggregate: aggregate.bytes,
    currentPositions: currentPositions.bytes,
    fetchedAt: options?.fetchedAt ?? new Date().toISOString(),
  });
  if (!register) return { outcome: "unavailable" };
  return { outcome: "parsed", register };
}
