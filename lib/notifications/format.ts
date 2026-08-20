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
  return cleaned ? `@${cleaned}` : "En medlem";
}

function getCategoryLabel(type: UserNotificationType | "message_summary") {
  switch (type) {
    case "contact_request":
      return "Kontaktförfrågan";
    case "forum_reply":
      return "Forumsvar";
    case "moderation_report":
      return "Ny rapport";
    case "moderation_decision":
      return "Moderering";
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

export function formatModerationReportNotificationBody(
  payload: UserNotificationPayload,
) {
  const reference = payload.referenceCode?.trim();
  const target = payload.targetLabel?.trim();
  const prefix = payload.urgent ? "PRIORITERAD rapport" : "Ny innehållsrapport";
  const details = [reference, target].filter(Boolean).join(" · ");

  return details ? `${prefix}: ${details}` : `${prefix} väntar på granskning.`;
}

export function formatModerationDecisionNotificationBody(
  payload: UserNotificationPayload,
) {
  const scope = payload.scopeDescription?.trim();
  return scope
    ? `DivLab har fattat ett modereringsbeslut som berör dig. ${scope}`
    : "DivLab har fattat ett modereringsbeslut som berör ditt innehåll eller din profil. Öppna notisen för skäl och möjlighet till omprövning.";
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
      : notification.type === "forum_reply"
        ? formatForumReplyNotificationBody(actorUsername, notification.payload)
        : notification.type === "moderation_report"
          ? formatModerationReportNotificationBody(notification.payload)
          : formatModerationDecisionNotificationBody(notification.payload);
  const isSystemModeration =
    notification.type === "moderation_report" ||
    notification.type === "moderation_decision";

  return {
    id: notification.id,
    type: notification.type,
    href: notification.destinationPath,
    categoryLabel: getCategoryLabel(notification.type),
    body,
    createdAt: notification.createdAt,
    isUnread: notification.readAt == null,
    actorUsername: isSystemModeration ? null : actorUsername,
    actorAvatarUrl: isSystemModeration
      ? null
      : getAvatarPublicUrl(
          notification.actorAvatarPath,
          notification.actorProfileUpdatedAt,
        ),
    actorInitials: isSystemModeration ? "DL" : getActorInitials(actorUsername),
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
