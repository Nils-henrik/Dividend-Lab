/** MVP popularity window — threads must have activity within this period. */
export const FORUM_POPULARITY_WINDOW_DAYS = 30;

/** One point per reply and one point per received reaction. */
export function calculateForumThreadPopularityScore(
  replyCount: number,
  reactionCount: number,
): number {
  return replyCount + reactionCount;
}

export function compareForumThreadsByPopularity(
  first: { popularityScore: number; lastActivityAt: string },
  second: { popularityScore: number; lastActivityAt: string },
): number {
  const scoreDifference = second.popularityScore - first.popularityScore;

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  return (
    new Date(second.lastActivityAt).getTime() -
    new Date(first.lastActivityAt).getTime()
  );
}

export function isWithinForumPopularityWindow(
  lastActivityAt: string,
  now = new Date(),
): boolean {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - FORUM_POPULARITY_WINDOW_DAYS);

  return new Date(lastActivityAt).getTime() >= cutoff.getTime();
}
