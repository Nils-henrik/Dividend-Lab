import type { PresenceKind, PresenceSnapshot, PresenceView } from "./types";

/**
 * Presence freshness contract.
 *
 * Client heartbeat (visible tab only): 30 seconds
 * Server write bound: 20 seconds
 * Online: last_seen_at within 90 seconds
 * Recent-active: last_seen_at within 24 hours
 * Stale/offline: older than 24 hours, missing, or share_active_status = false
 *
 * Privacy invalidation:
 * Accepted contacts may read the presence row even when sharing is off, but
 * last_seen_at is NULL in that state. Realtime UPDATE events therefore remain
 * readable and must immediately clear cached online/recent UI.
 */

export const PRESENCE_HEARTBEAT_INTERVAL_MS = 30_000;
export const PRESENCE_HEARTBEAT_MIN_WRITE_MS = 20_000;
export const PRESENCE_ONLINE_THRESHOLD_MS = 90_000;
export const PRESENCE_RECENT_THRESHOLD_MS = 24 * 60 * 60 * 1000;
export const PRESENCE_FRESHNESS_TICK_MS = 15_000;

export function resolvePresenceKind(
  snapshot: PresenceSnapshot | null | undefined,
  nowMs: number,
): PresenceKind {
  if (!snapshot?.shareActiveStatus || !snapshot.lastSeenAt) {
    return "offline";
  }

  const lastSeenMs = Date.parse(snapshot.lastSeenAt);
  if (!Number.isFinite(lastSeenMs)) {
    return "offline";
  }

  const ageMs = nowMs - lastSeenMs;
  if (ageMs < 0) {
    return "offline";
  }

  if (ageMs <= PRESENCE_ONLINE_THRESHOLD_MS) {
    return "online";
  }

  if (ageMs <= PRESENCE_RECENT_THRESHOLD_MS) {
    return "recent";
  }

  return "offline";
}

export function formatRecentActiveCompact(lastSeenAt: string, nowMs: number) {
  const lastSeenMs = Date.parse(lastSeenAt);
  if (!Number.isFinite(lastSeenMs)) {
    return null;
  }

  const ageMs = Math.max(0, nowMs - lastSeenMs);
  const ageMinutes = Math.max(1, Math.round(ageMs / 60_000));

  if (ageMinutes < 60) {
    return `${ageMinutes} min`;
  }

  const ageHours = Math.round(ageMinutes / 60);
  if (ageHours < 24) {
    return `${ageHours} tim`;
  }

  return null;
}

export function formatRecentActiveSrLabel(lastSeenAt: string, nowMs: number) {
  const compact = formatRecentActiveCompact(lastSeenAt, nowMs);
  if (!compact) {
    return null;
  }

  if (compact.endsWith(" min")) {
    const minutes = compact.replace(" min", "");
    return minutes === "1"
      ? "Senast aktiv för 1 minut sedan"
      : `Senast aktiv för ${minutes} minuter sedan`;
  }

  const hours = compact.replace(" tim", "");
  return hours === "1"
    ? "Senast aktiv för 1 timme sedan"
    : `Senast aktiv för ${hours} timmar sedan`;
}

export function toPresenceView(
  snapshot: PresenceSnapshot | null | undefined,
  nowMs: number,
): PresenceView {
  if (!snapshot?.shareActiveStatus) {
    return {
      kind: "offline",
      lastSeenAt: null,
      compactLabel: null,
      srLabel: null,
    };
  }

  const kind = resolvePresenceKind(snapshot, nowMs);

  if (kind === "online") {
    return {
      kind,
      lastSeenAt: snapshot.lastSeenAt,
      compactLabel: "Aktiv nu",
      srLabel: "Aktiv nu",
    };
  }

  if (kind === "recent" && snapshot.lastSeenAt) {
    return {
      kind,
      lastSeenAt: snapshot.lastSeenAt,
      compactLabel: formatRecentActiveCompact(snapshot.lastSeenAt, nowMs),
      srLabel: formatRecentActiveSrLabel(snapshot.lastSeenAt, nowMs),
    };
  }

  return {
    kind: "offline",
    lastSeenAt: snapshot.lastSeenAt ?? null,
    compactLabel: null,
    srLabel: null,
  };
}

export type PresenceRealtimePayload = {
  eventType?: string;
  new?: unknown;
  old?: unknown;
};

function readPresenceUserId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const userId = (value as { user_id?: unknown }).user_id;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

export function mapPresenceRealtimeRow(row: unknown): PresenceSnapshot | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as {
    user_id?: unknown;
    last_seen_at?: unknown;
    share_active_status?: unknown;
  };
  const userId = readPresenceUserId(record);
  if (!userId) {
    return null;
  }

  const lastSeenAt =
    typeof record.last_seen_at === "string" && record.last_seen_at.length > 0
      ? record.last_seen_at
      : null;

  return {
    userId,
    lastSeenAt,
    shareActiveStatus: record.share_active_status === true,
  };
}

export function applyPresenceRealtimePayload(
  current: Record<string, PresenceSnapshot>,
  payload: PresenceRealtimePayload,
): Record<string, PresenceSnapshot> {
  if (payload.eventType === "DELETE") {
    const userId = readPresenceUserId(payload.old);
    if (!userId) {
      return current;
    }

    const next = { ...current };
    delete next[userId];
    return next;
  }

  const snapshot = mapPresenceRealtimeRow(payload.new);
  if (!snapshot) {
    return current;
  }

  return {
    ...current,
    [snapshot.userId]: snapshot,
  };
}

export function mapPresenceViews(
  presenceByUserId: Record<string, PresenceSnapshot>,
  nowMs: number,
  options?: { realtimeHonest?: boolean },
) {
  const views: Record<string, PresenceView> = {};

  for (const [userId, snapshot] of Object.entries(presenceByUserId)) {
    const view = toPresenceView(snapshot, nowMs);
    if (options?.realtimeHonest === false && view.kind === "online") {
      views[userId] = {
        ...view,
        kind: "recent",
        compactLabel: snapshot.lastSeenAt
          ? formatRecentActiveCompact(snapshot.lastSeenAt, nowMs)
          : null,
        srLabel: snapshot.lastSeenAt
          ? formatRecentActiveSrLabel(snapshot.lastSeenAt, nowMs)
          : "Aktivitetsstatus otillgänglig",
      };
      continue;
    }

    views[userId] = view;
  }

  return views;
}
