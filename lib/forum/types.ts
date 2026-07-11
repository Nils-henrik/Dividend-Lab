import type { ForumStatusTier } from "@/lib/forum/forum-status";

export const FORUM_TITLE_MAX_LENGTH = 120;
export const FORUM_BODY_MAX_LENGTH = 5000;

export type ForumActionState = {
  status: "idle" | "error";
  message: string;
};

export type ForumReactionActionResult = {
  ok: boolean;
  message?: string;
};

export type ForumThreadRecord = {
  id: string;
  slug: string;
  authorId: string;
  categorySlug: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorProfileCreatedAt: string | null;
  authorAvatarPath: string | null;
  authorProfileUpdatedAt: string | null;
  replyCount: number;
  lastActivityAt?: string;
  reactionCount?: number;
  popularityScore?: number;
};

export type ForumReplyRecord = {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorProfileCreatedAt: string | null;
  authorAvatarPath: string | null;
  authorProfileUpdatedAt: string | null;
};

export type ForumCategoryCounts = Record<
  string,
  {
    discussions: number;
    latestActivity: string | null;
  }
>;

export type ForumAuthorActivityItem = {
  id: string;
  kind: "thread" | "reply";
  threadSlug: string;
  threadTitle: string;
  body: string;
  createdAt: string;
};

export type ForumAuthorStats = {
  threadCount: number;
  replyCount: number;
  contributionCount: number;
  totalReceivedReactions: number;
  reactionsByType: {
    helpful: number;
    insightful: number;
    well_researched: number;
  };
  currentStatus: ForumStatusTier;
  nextStatus: ForumStatusTier | null;
  remainingContributions: number;
  remainingReactions: number;
};
