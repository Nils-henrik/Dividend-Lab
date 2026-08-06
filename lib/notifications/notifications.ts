import { createClient } from "@/lib/supabase/server";
import type {
  UserNotificationPayload,
  UserNotificationRecord,
  UserNotificationType,
} from "@/lib/notifications/types";

type NotificationProfileRow = {
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  updated_at: string | null;
};

type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: UserNotificationType;
  entity_id: string | null;
  destination_path: string;
  payload: UserNotificationPayload | null;
  dedupe_key: string;
  read_at: string | null;
  created_at: string;
  profiles: NotificationProfileRow | NotificationProfileRow[] | null;
};

function isMissingNotificationsTableError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("user_notifications") === true
  );
}

function getProfileRow(
  profiles: NotificationProfileRow | NotificationProfileRow[] | null,
): NotificationProfileRow | null {
  if (!profiles) {
    return null;
  }

  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

function mapNotificationRow(row: NotificationRow): UserNotificationRecord {
  const profile = getProfileRow(row.profiles);

  return {
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    type: row.type,
    entityId: row.entity_id,
    destinationPath: row.destination_path,
    payload: row.payload ?? {},
    dedupeKey: row.dedupe_key,
    readAt: row.read_at,
    createdAt: row.created_at,
    actorUsername: profile?.username ?? null,
    actorDisplayName: profile?.display_name ?? null,
    actorAvatarPath: profile?.avatar_path ?? null,
    actorProfileUpdatedAt: profile?.updated_at ?? null,
  };
}

export async function getUserNotifications(userId: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_notifications")
    .select(
      `
      id,
      recipient_id,
      actor_id,
      type,
      entity_id,
      destination_path,
      payload,
      dedupe_key,
      read_at,
      created_at,
      profiles:actor_id (
        username,
        display_name,
        avatar_path,
        updated_at
      )
    `,
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingNotificationsTableError(error)) {
      return [] as UserNotificationRecord[];
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) {
    if (isMissingNotificationsTableError(error)) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_all_notifications_read");

  if (error) {
    throw new Error(error.message);
  }
}
