export const FORUM_REACTION_OPTIONS = [
  { type: "helpful", label: "Hjälpsam", icon: "👍" },
  { type: "insightful", label: "Insiktsfull", icon: "💡" },
  { type: "well_researched", label: "Välgrundad", icon: "📊" },
] as const;

export type ForumReactionType =
  (typeof FORUM_REACTION_OPTIONS)[number]["type"];

export type ForumReactionTargetType = "thread" | "reply";

export type ForumReactionRow = {
  id: string;
  user_id: string;
  target_type: ForumReactionTargetType;
  thread_id: string | null;
  reply_id: string | null;
  reaction_type: ForumReactionType;
};

export type ForumReactionSummary = {
  type: ForumReactionType;
  label: string;
  icon: string;
  count: number;
  active: boolean;
};

export type ForumReactionMap = Record<string, ForumReactionSummary[]>;

export function getForumReactionTargetKey(
  targetType: ForumReactionTargetType,
  targetId: string,
) {
  return `${targetType}:${targetId}`;
}

export function buildEmptyReactionSummaries(
  activeByType: Partial<Record<ForumReactionType, boolean>> = {},
): ForumReactionSummary[] {
  return FORUM_REACTION_OPTIONS.map((option) => ({
    type: option.type,
    label: option.label,
    icon: option.icon,
    count: 0,
    active: activeByType[option.type] ?? false,
  }));
}

export function buildReactionSummaries(
  rows: ForumReactionRow[],
  targetType: ForumReactionTargetType,
  targetId: string,
  currentUserId?: string | null,
): ForumReactionSummary[] {
  const relevantRows = rows.filter((row) => {
    if (targetType === "thread") {
      return row.target_type === "thread" && row.thread_id === targetId;
    }

    return row.target_type === "reply" && row.reply_id === targetId;
  });

  const counts = new Map<ForumReactionType, number>();
  const activeByType = new Map<ForumReactionType, boolean>();

  for (const row of relevantRows) {
    counts.set(row.reaction_type, (counts.get(row.reaction_type) ?? 0) + 1);

    if (currentUserId && row.user_id === currentUserId) {
      activeByType.set(row.reaction_type, true);
    }
  }

  return FORUM_REACTION_OPTIONS.map((option) => ({
    type: option.type,
    label: option.label,
    icon: option.icon,
    count: counts.get(option.type) ?? 0,
    active: activeByType.get(option.type) ?? false,
  }));
}

export function buildForumReactionMap(
  rows: ForumReactionRow[],
  threadId: string,
  replyIds: string[],
  currentUserId?: string | null,
): ForumReactionMap {
  const map: ForumReactionMap = {};

  map[getForumReactionTargetKey("thread", threadId)] = buildReactionSummaries(
    rows,
    "thread",
    threadId,
    currentUserId,
  );

  for (const replyId of replyIds) {
    map[getForumReactionTargetKey("reply", replyId)] = buildReactionSummaries(
      rows,
      "reply",
      replyId,
      currentUserId,
    );
  }

  return map;
}

export function isForumReactionType(value: string): value is ForumReactionType {
  return FORUM_REACTION_OPTIONS.some((option) => option.type === value);
}

export function isForumReactionTargetType(
  value: string,
): value is ForumReactionTargetType {
  return value === "thread" || value === "reply";
}
