/** Swedish singular/plural label for accepted contact counts. */
export function formatContactCountLabel(count: number): string {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

  if (safeCount === 1) {
    return "1 kontakt";
  }

  return `${safeCount} kontakter`;
}

export function normalizeContactPair(
  firstUserId: string,
  secondUserId: string,
): { userLowId: string; userHighId: string } {
  if (firstUserId <= secondUserId) {
    return { userLowId: firstUserId, userHighId: secondUserId };
  }

  return { userLowId: secondUserId, userHighId: firstUserId };
}
