export function getThreadLastActivityAt(
  threadCreatedAt: string,
  latestReplyAt: string | null,
): string {
  if (!latestReplyAt) {
    return threadCreatedAt;
  }

  return new Date(latestReplyAt).getTime() > new Date(threadCreatedAt).getTime()
    ? latestReplyAt
    : threadCreatedAt;
}
