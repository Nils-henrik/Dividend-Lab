import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyPresenceRealtimePayload,
  formatRecentActiveCompact,
  formatRecentActiveSrLabel,
  mapPresenceRealtimeRow,
  PRESENCE_ONLINE_THRESHOLD_MS,
  PRESENCE_RECENT_THRESHOLD_MS,
  resolvePresenceKind,
  toPresenceView,
} from "../lib/messages/presence";
import type { PresenceSnapshot } from "../lib/messages/types";

const now = Date.parse("2026-08-15T12:00:00.000Z");

function snapshot(
  overrides: Partial<PresenceSnapshot> = {},
): PresenceSnapshot {
  return {
    userId: "user-1",
    lastSeenAt: new Date(now - 30_000).toISOString(),
    shareActiveStatus: true,
    ...overrides,
  };
}

describe("presence freshness", () => {
  it("treats a fresh heartbeat as online", () => {
    assert.equal(resolvePresenceKind(snapshot(), now), "online");
    assert.equal(
      resolvePresenceKind(
        snapshot({
          lastSeenAt: new Date(now - PRESENCE_ONLINE_THRESHOLD_MS).toISOString(),
        }),
        now,
      ),
      "online",
    );
  });

  it("treats a stale heartbeat as offline after the recent window", () => {
    assert.equal(
      resolvePresenceKind(
        snapshot({
          lastSeenAt: new Date(
            now - PRESENCE_RECENT_THRESHOLD_MS - 1,
          ).toISOString(),
        }),
        now,
      ),
      "offline",
    );
  });

  it("uses recent-active between the online and recent thresholds", () => {
    assert.equal(
      resolvePresenceKind(
        snapshot({
          lastSeenAt: new Date(now - 5 * 60_000).toISOString(),
        }),
        now,
      ),
      "recent",
    );
  });

  it("never exposes online or recent UI when sharing is disabled", () => {
    const view = toPresenceView(
      snapshot({
        shareActiveStatus: false,
        lastSeenAt: new Date(now - 30_000).toISOString(),
      }),
      now,
    );
    assert.equal(view.kind, "offline");
    assert.equal(view.lastSeenAt, null);
    assert.equal(view.compactLabel, null);
    assert.equal(view.srLabel, null);
  });

  it("maps a disabled row with no activity timestamp to offline/hidden", () => {
    const view = toPresenceView(
      snapshot({
        shareActiveStatus: false,
        lastSeenAt: null,
      }),
      now,
    );
    assert.equal(view.kind, "offline");
    assert.equal(view.lastSeenAt, null);
    assert.equal(view.compactLabel, null);
  });

  it("does not infer online from a missing last_seen_at", () => {
    assert.equal(
      resolvePresenceKind(snapshot({ lastSeenAt: null }), now),
      "offline",
    );
  });

  it("does not treat a future last_seen_at as online", () => {
    assert.equal(
      resolvePresenceKind(
        snapshot({ lastSeenAt: new Date(now + 60_000).toISOString() }),
        now,
      ),
      "offline",
    );
  });
});

describe("Swedish recent-active formatting", () => {
  it("formats compact minute and hour labels", () => {
    assert.equal(
      formatRecentActiveCompact(new Date(now - 5 * 60_000).toISOString(), now),
      "5 min",
    );
    assert.equal(
      formatRecentActiveCompact(new Date(now - 32 * 60_000).toISOString(), now),
      "32 min",
    );
    assert.equal(
      formatRecentActiveCompact(new Date(now - 2 * 60 * 60_000).toISOString(), now),
      "2 tim",
    );
  });

  it("formats screen-reader Swedish without relying on color", () => {
    assert.equal(
      formatRecentActiveSrLabel(new Date(now - 5 * 60_000).toISOString(), now),
      "Senast aktiv för 5 minuter sedan",
    );
    assert.equal(
      formatRecentActiveSrLabel(new Date(now - 60 * 60_000).toISOString(), now),
      "Senast aktiv för 1 timme sedan",
    );
    assert.equal(toPresenceView(snapshot(), now).srLabel, "Aktiv nu");
  });
});

describe("presence realtime invalidation", () => {
  it("lets an accepted contact keep a readable enabled snapshot", () => {
    const enabled = mapPresenceRealtimeRow({
      user_id: "user-1",
      last_seen_at: new Date(now - 15_000).toISOString(),
      share_active_status: true,
    });
    assert.equal(enabled?.shareActiveStatus, true);
    assert.ok(enabled?.lastSeenAt);
    assert.equal(resolvePresenceKind(enabled, now), "online");
    assert.equal(toPresenceView(enabled, now).compactLabel, "Aktiv nu");
  });

  it("clears cached online/recent state immediately when sharing is disabled", () => {
    const enabled = snapshot();
    const cache = { [enabled.userId]: enabled };
    assert.equal(toPresenceView(cache[enabled.userId], now).kind, "online");

    const next = applyPresenceRealtimePayload(cache, {
      eventType: "UPDATE",
      new: {
        user_id: enabled.userId,
        last_seen_at: null,
        share_active_status: false,
      },
    });

    const view = toPresenceView(next[enabled.userId], now);
    assert.equal(next[enabled.userId]?.shareActiveStatus, false);
    assert.equal(next[enabled.userId]?.lastSeenAt, null);
    assert.equal(view.kind, "offline");
    assert.equal(view.lastSeenAt, null);
    assert.equal(view.compactLabel, null);
    assert.equal(view.srLabel, null);
  });

  it("does not treat a disabled heartbeat-shaped row as activity", () => {
    const disabled = applyPresenceRealtimePayload(
      { "user-1": snapshot() },
      {
        eventType: "UPDATE",
        new: {
          user_id: "user-1",
          last_seen_at: null,
          share_active_status: false,
        },
      },
    );

    const afterHeartbeatWhileDisabled = applyPresenceRealtimePayload(disabled, {
      eventType: "UPDATE",
      new: {
        user_id: "user-1",
        last_seen_at: null,
        share_active_status: false,
      },
    });

    assert.equal(
      afterHeartbeatWhileDisabled["user-1"]?.lastSeenAt,
      null,
    );
    assert.equal(
      resolvePresenceKind(afterHeartbeatWhileDisabled["user-1"], now),
      "offline",
    );
  });

  it("restores a fresh timestamp when sharing is re-enabled", () => {
    const disabled = applyPresenceRealtimePayload(
      { "user-1": snapshot() },
      {
        eventType: "UPDATE",
        new: {
          user_id: "user-1",
          last_seen_at: null,
          share_active_status: false,
        },
      },
    );

    const reenabledAt = new Date(now - 5_000).toISOString();
    const reenabled = applyPresenceRealtimePayload(disabled, {
      eventType: "UPDATE",
      new: {
        user_id: "user-1",
        last_seen_at: reenabledAt,
        share_active_status: true,
      },
    });

    assert.equal(reenabled["user-1"]?.shareActiveStatus, true);
    assert.equal(reenabled["user-1"]?.lastSeenAt, reenabledAt);
    assert.equal(resolvePresenceKind(reenabled["user-1"], now), "online");
    assert.equal(toPresenceView(reenabled["user-1"], now).compactLabel, "Aktiv nu");
  });
});

