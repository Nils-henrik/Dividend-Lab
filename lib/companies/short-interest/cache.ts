import { FI_SHORT_INTEREST_REVALIDATE_SECONDS } from "@/lib/companies/short-interest/constants";
import type { FiShortInterestRegister } from "@/lib/companies/short-interest/types";

export type FiRegisterRead =
  | { outcome: "parsed"; register: FiShortInterestRegister }
  | { outcome: "unavailable" }
  | { outcome: "transient" };

type Slot = {
  expiresAt: number;
  register: FiShortInterestRegister | null;
};

let slot: Slot | null = null;
let pending: Promise<FiShortInterestRegister | null> | null = null;

export function resetFiShortInterestMemoryCache() {
  slot = null;
  pending = null;
}

/**
 * In-process cache for the current FI snapshot.
 * A transient transport failure is returned as null and is not stored.
 * A parsed register, or a durable schema/content failure, is stored until TTL.
 */
export async function loadCachedFiShortInterest(
  read: () => Promise<FiRegisterRead>,
  now = Date.now(),
  ttlMs = FI_SHORT_INTEREST_REVALIDATE_SECONDS * 1000,
): Promise<FiShortInterestRegister | null> {
  if (slot && slot.expiresAt > now) return slot.register;
  if (pending) return pending;

  pending = (async () => {
    const result = await read();
    if (result.outcome === "transient") return null;
    slot = {
      expiresAt: Date.now() + ttlMs,
      register: result.outcome === "parsed" ? result.register : null,
    };
    return slot.register;
  })().finally(() => {
    pending = null;
  });

  return pending;
}
