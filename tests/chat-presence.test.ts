import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatRecentActiveCompact,
  formatRecentActiveSrLabel,
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
      snapshot({ shareActiveStatus: false }),
      now,
    );
    assert.equal(view.kind, "offline");
    assert.equal(view.compactLabel, null);
    assert.equal(view.srLabel, null);
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
