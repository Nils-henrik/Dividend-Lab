import { createClient } from "@/lib/supabase/server";
import type {
  UserNotificationPayload,
  UserNotificationRecord,
  UserNotificationType,
} from "@/lib/notifications/types";

type NotificationProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  updated_at: string | null;
};

type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: UserNotificationType;
  entity_id: string | null;
  destination_path: string;
  payload: UserNotificationPayload | null;
  dedupe_key: string;
  read_at: string | null;
  created_at: string;
};

function isSoftNotificationQueryError(error: {
  code?: string;
  message?: string;
}) {
  const message = error.message ?? "";

  return (
    error.code === "PGRST205" ||
    error.code === "PGRST200" ||
    message.includes("user_notifications") ||
    message.includes("schema cache")
  );
}

function mapNotificationRow(
  row: NotificationRow,
  profile: NotificationProfileRow | null,
): UserNotificationRecord {
  const payload = row.payload ?? {};

  return {
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    type: row.type,
    entityId: row.entity_id,
    destinationPath: row.destination_path,
    payload,
    dedupeKey: row.dedupe_key,
    readAt: row.read_at,
    createdAt: row.created_at,
    actorUsername:
      profile?.username ??
      (typeof payload.actorUsername === "string" ? payload.actorUsername : null),
    actorDisplayName: profile?.display_name ?? null,
    actorAvatarPath: profile?.avatar_path ?? null,
    actorProfileUpdatedAt: profile?.updated_at ?? null,
  };
}

async function getActorProfilesByIds(actorIds: Array<string | null>) {
  const uniqueIds = [...new Set(actorIds.filter((id): id is string => Boolean(id)))];

  if (uniqueIds.length === 0) {
    return new Map<string, NotificationProfileRow>();
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_path, updated_at")
      .in("id", uniqueIds);

    if (error) {
      return new Map<string, NotificationProfileRow>();
    }

    return new Map(
      ((data ?? []) as NotificationProfileRow[]).map((profile) => [
        profile.id,
        profile,
      ]),
    );
  } catch {
    return new Map<string, NotificationProfileRow>();
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  try {
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
        created_at
      `,
      )
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isSoftNotificationQueryError(error)) {
        return [] as UserNotificationRecord[];
      }

      throw new Error(error.message);
    }

    const rows = (data ?? []) as NotificationRow[];
    const profiles = await getActorProfilesByIds(rows.map((row) => row.actor_id));

    return rows.map((row) =>
      mapNotificationRow(
        row,
        row.actor_id ? profiles.get(row.actor_id) ?? null : null,
      ),
    );
  } catch {
    return [] as UserNotificationRecord[];
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .is("read_at", null);

    if (error) {
      if (isSoftNotificationQueryError(error)) {
        return 0;
      }

      throw new Error(error.message);
    }

    return count ?? 0;
  } catch {
    return 0;
  }
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
