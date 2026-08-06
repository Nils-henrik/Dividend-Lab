import { getAvatarPublicUrl } from "@/lib/profiles/identity";
import type {
  NotificationFeedItem,
  UserNotificationPayload,
  UserNotificationRecord,
  UserNotificationType,
} from "@/lib/notifications/types";
import { formatForumRelativeActivity } from "@/lib/forum/format";

function getActorHandle(username: string | null | undefined) {
  const cleaned = username?.replace(/^@/, "").trim();
  return cleaned ? `@${cleaned}` : "@medlem";
}

function getCategoryLabel(type: UserNotificationType | "message_summary") {
  switch (type) {
    case "contact_request":
      return "Kontaktförfrågan";
    case "forum_reply":
      return "Forumsvar";
    case "message_summary":
      return "Meddelande";
    default:
      return "Notifikation";
  }
}

function getActorInitials(username: string | null | undefined) {
  const source = username?.replace(/^@/, "").trim() || "DL";
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "DL";
}

export function formatContactRequestNotificationBody(
  actorUsername: string | null | undefined,
) {
  return `${getActorHandle(actorUsername)} vill lägga till dig som kontakt.`;
}

export function formatForumReplyNotificationBody(
  actorUsername: string | null | undefined,
  payload: UserNotificationPayload,
) {
  const handle = getActorHandle(
    actorUsername ?? payload.actorUsername ?? null,
  );
  const title = payload.threadTitle?.trim() || "en diskussion";

  if (payload.kind === "reply") {
    return `${handle} svarade på ditt inlägg i “${title}”.`;
  }

  return `${handle} svarade i din tråd “${title}”.`;
}

export function formatUnreadBadgeLabel(count: number) {
  const displayCount = count > 9 ? "9+" : String(count);
  return count === 1
    ? "1 oläst notifikation"
    : `${displayCount} olästa notifikationer`;
}

export function formatUnreadMessageNotificationLabel(count: number) {
  if (count === 1) {
    return "Du har 1 oläst meddelande";
  }

  return `Du har ${count} olästa meddelanden`;
}

export function mapUserNotificationToFeedItem(
  notification: UserNotificationRecord,
): NotificationFeedItem {
  const actorUsername =
    notification.actorUsername ??
    notification.payload.actorUsername ??
    null;
  const body =
    notification.type === "contact_request"
      ? formatContactRequestNotificationBody(actorUsername)
      : formatForumReplyNotificationBody(actorUsername, notification.payload);

  return {
    id: notification.id,
    type: notification.type,
    href: notification.destinationPath,
    categoryLabel: getCategoryLabel(notification.type),
    body,
    createdAt: notification.createdAt,
    isUnread: notification.readAt == null,
    actorUsername,
    actorAvatarUrl: getAvatarPublicUrl(
      notification.actorAvatarPath,
      notification.actorProfileUpdatedAt,
    ),
    actorInitials: getActorInitials(actorUsername),
  };
}

export function createMessageSummaryFeedItem(
  unreadMessageCount: number,
): NotificationFeedItem | null {
  if (unreadMessageCount <= 0) {
    return null;
  }

  return {
    id: "message-summary",
    type: "message_summary",
    href: "/messages",
    categoryLabel: getCategoryLabel("message_summary"),
    body: formatUnreadMessageNotificationLabel(unreadMessageCount),
    createdAt: null,
    isUnread: true,
    actorUsername: null,
    actorAvatarUrl: null,
    actorInitials: "M",
  };
}

export function formatNotificationRelativeTime(value: string | null) {
  if (!value) {
    return null;
  }

  return formatForumRelativeActivity(value);
}
