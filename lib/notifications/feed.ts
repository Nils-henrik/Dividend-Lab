import {
  createMessageSummaryFeedItem,
  mapUserNotificationToFeedItem,
} from "@/lib/notifications/format";
import {
  getUnreadNotificationCount,
  getUserNotifications,
} from "@/lib/notifications/notifications";
import type { NotificationFeedItem } from "@/lib/notifications/types";
import { getUnreadMessageCount } from "@/lib/messages/messages";

export type NotificationBellData = {
  unreadMessageCount: number;
  unreadNotificationCount: number;
  unreadCount: number;
  items: NotificationFeedItem[];
};

export async function getNotificationBellData(
  userId: string,
): Promise<NotificationBellData> {
  let unreadMessageCount = 0;
  let unreadNotificationCount = 0;
  let notifications: Awaited<ReturnType<typeof getUserNotifications>> = [];

  try {
    unreadMessageCount = await getUnreadMessageCount(userId);
  } catch {
    unreadMessageCount = 0;
  }

  try {
    [unreadNotificationCount, notifications] = await Promise.all([
      getUnreadNotificationCount(userId),
      getUserNotifications(userId, 20),
    ]);
  } catch {
    unreadNotificationCount = 0;
    notifications = [];
  }

  const messageItem = createMessageSummaryFeedItem(unreadMessageCount);
  const notificationItems = notifications.map(mapUserNotificationToFeedItem);
  const items = [
    ...(messageItem ? [messageItem] : []),
    ...notificationItems,
  ];

  return {
    unreadMessageCount,
    unreadNotificationCount,
    unreadCount: unreadMessageCount + unreadNotificationCount,
    items,
  };
}
