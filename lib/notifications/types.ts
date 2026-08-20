export type UserNotificationType =
  | "contact_request"
  | "forum_reply"
  | "moderation_report"
  | "moderation_decision";

export type UserNotificationPayload = {
  actorUsername?: string;
  connectionId?: string;
  replyId?: string;
  threadId?: string;
  threadSlug?: string;
  threadTitle?: string;
  kind?: "thread" | "reply";
  actionId?: string;
  actionType?: string;
  scopeDescription?: string;
  referenceCode?: string;
  reportCategory?: string;
  targetLabel?: string;
  urgent?: boolean;
};

export type UserNotificationRecord = {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: UserNotificationType;
  entityId: string | null;
  destinationPath: string;
  payload: UserNotificationPayload;
  dedupeKey: string;
  readAt: string | null;
  createdAt: string;
  actorUsername: string | null;
  actorDisplayName: string | null;
  actorAvatarPath: string | null;
  actorProfileUpdatedAt: string | null;
};

export type NotificationFeedItem = {
  id: string;
  type: UserNotificationType | "message_summary";
  href: string;
  categoryLabel: string;
  body: string;
  createdAt: string | null;
  isUnread: boolean;
  actorUsername: string | null;
  actorAvatarUrl: string | null;
  actorInitials: string;
};

export type NotificationActionState = {
  status: "idle" | "success" | "error";
  message: string;
};
