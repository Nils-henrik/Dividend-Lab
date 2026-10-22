import { timingSafeEqual } from "node:crypto";

/** The scheduler marker identifies the caller type; only the secret authenticates it. */
export function isAuthorizedModelPortfolioScheduler(
  headers: Headers,
  configuredSecret: string | undefined,
): boolean {
  const secret = configuredSecret?.trim();
  const authorization = headers.get("authorization");
  if (
    !secret ||
    !authorization ||
    headers.get("x-divlab-scheduler") !== "supabase-cron-v1"
  ) {
    return false;
  }
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(authorization, "utf8");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
