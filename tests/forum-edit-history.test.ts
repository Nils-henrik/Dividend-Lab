import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canEditForumContent } from "../lib/forum/edit-eligibility";
import { formatForumEditedLabel } from "../lib/forum/format";
import {
  buildForumReplyHistory,
  buildForumThreadHistory,
  mapReplyRevisionRow,
  mapThreadRevisionRow,
} from "../lib/forum/history";
import { validateForumBody, validateForumTitle } from "../lib/forum/validation";

describe("forum edit eligibility", () => {
  it("allows only the authenticated author of persisted content", () => {
    assert.equal(
      canEditForumContent({
        isAuthenticated: true,
        currentUserId: "user-1",
        authorUserId: "user-1",
      }),
      true,
    );
  });

  it("blocks other users, guests, and demo content", () => {
    assert.equal(
      canEditForumContent({
        isAuthenticated: true,
        currentUserId: "user-1",
        authorUserId: "user-2",
      }),
      false,
    );
    assert.equal(
      canEditForumContent({
        isAuthenticated: false,
        currentUserId: "user-1",
        authorUserId: "user-1",
      }),
      false,
    );
    assert.equal(
      canEditForumContent({
        isDemoContent: true,
        isAuthenticated: true,
        currentUserId: "user-1",
        authorUserId: "user-1",
      }),
      false,
    );
  });
});

describe("forum edit validation", () => {
  it("reuses creation title/body limits", () => {
    assert.equal(validateForumTitle("").error != null, true);
    assert.equal(validateForumTitle("a".repeat(121)).error != null, true);
    assert.equal(validateForumTitle("  Hej  ").title, "Hej");
    assert.equal(validateForumBody("").error != null, true);
    assert.equal(validateForumBody("a".repeat(5001)).error != null, true);
    assert.equal(validateForumBody("  Text  ").body, "Text");
  });
});

describe("forum edited label", () => {
  it("formats a clear Swedish edited marker", () => {
    const label = formatForumEditedLabel("2026-08-07T09:24:00.000Z");
    assert.match(label, /^Redigerad /);
  });
});

describe("forum revision history mapping", () => {
  it("maps revision rows and marks current plus original versions", () => {
    const threadHistory = buildForumThreadHistory({
      currentVersion: 3,
      currentTitle: "Ny rubrik",
      currentBody: "Ny text",
      currentTimestamp: "2026-08-07T12:00:00.000Z",
      revisions: [
        mapThreadRevisionRow({
          id: "r2",
          thread_id: "t1",
          version: 2,
          title: "Mellanrubrik",
          body: "Mellanttext",
          archived_at: "2026-08-07T11:00:00.000Z",
        }),
        mapThreadRevisionRow({
          id: "r1",
          thread_id: "t1",
          version: 1,
          title: "Originalrubrik",
          body: "Originaltext",
          archived_at: "2026-08-07T10:00:00.000Z",
        }),
      ],
    });

    assert.equal(threadHistory.length, 3);
    assert.equal(threadHistory[0]?.isCurrent, true);
    assert.equal(threadHistory[0]?.title, "Ny rubrik");
    assert.equal(threadHistory[2]?.isOriginal, true);
    assert.equal(threadHistory[2]?.version, 1);
    assert.equal(threadHistory[2]?.title, "Originalrubrik");

    const replyHistory = buildForumReplyHistory({
      currentVersion: 2,
      currentBody: "Uppdaterat svar",
      currentTimestamp: "2026-08-07T12:00:00.000Z",
      revisions: [
        mapReplyRevisionRow({
          id: "rr1",
          reply_id: "reply-1",
          version: 1,
          body: "Originalsvar",
          archived_at: "2026-08-07T10:00:00.000Z",
        }),
      ],
    });

    assert.equal(replyHistory.length, 2);
    assert.equal(replyHistory[0]?.isCurrent, true);
    assert.equal(replyHistory[1]?.isOriginal, true);
    assert.equal(replyHistory[1]?.body, "Originalsvar");
  });

  it("treats an unedited current version as original", () => {
    const history = buildForumThreadHistory({
      currentVersion: 1,
      currentTitle: "Endast original",
      currentBody: "Ingen redigering",
      currentTimestamp: "2026-08-07T09:00:00.000Z",
      revisions: [],
    });

    assert.equal(history.length, 1);
    assert.equal(history[0]?.isCurrent, true);
    assert.equal(history[0]?.isOriginal, true);
  });
});

describe("forum edit no-op semantics", () => {
  it("considers normalized equal title/body a no-op candidate", () => {
    const title = validateForumTitle("  Rubrik  ");
    const body = validateForumBody("  Brödtext  ");
    assert.equal(title.title, "Rubrik");
    assert.equal(body.body, "Brödtext");
    assert.equal(title.title === "Rubrik" && body.body === "Brödtext", true);
  });
});
