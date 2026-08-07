/**
 * DivBrain Ticket 1C-3 — persisted source → transcript source boundary tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { mapMessageRowToDomain } from "../repository/mapping";
import type { DivBrainMessageRow } from "../repository/rows";
import { mapDivBrainMessageToShellTranscriptItem } from "./transcript";

const CONVERSATION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MESSAGE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const __dirname = dirname(fileURLToPath(import.meta.url));

const LEARNING_SOURCE = {
  id: "learning:vad-ar-en-indexfond",
  title: "Vad är en indexfond?",
  category: "divlab_learning",
  verificationState: "internally_curated",
  freshnessState: "current",
  publisher: "DivLab",
  publishedAt: "2026-07-01",
  dataAsOf: "2026-07-01",
  attribution: "DivLab Learning · Indexfonder",
  excerpt: "En indexfond följer utvecklingen i ett bestämt index.",
  internalRoute: "/learning/vad-ar-en-indexfond",
  recordRef: "learning/vad-ar-en-indexfond",
  schemaVersion: 1,
} as const;

function row(overrides: Partial<DivBrainMessageRow> = {}): DivBrainMessageRow {
  return {
    id: MESSAGE_ID,
    conversation_id: CONVERSATION_ID,
    role: "assistant",
    content: "En indexfond följer ett index. [1]",
    completion_status: "completed",
    safety_classification: null,
    sources: [LEARNING_SOURCE],
    error_code: null,
    created_at: "2026-08-07T14:00:00.000Z",
    ...overrides,
  };
}

describe("DivBrain persisted message sources", () => {
  it("retains validated sources for completed assistant messages", () => {
    const mapped = mapMessageRowToDomain(row());
    assert.equal(mapped.ok, true);
    if (!mapped.ok) return;

    assert.equal(mapped.data.sources?.length, 1);
    assert.equal(mapped.data.sources?.[0]?.id, LEARNING_SOURCE.id);
    assert.equal(
      mapped.data.sources?.[0]?.internalRoute,
      LEARNING_SOURCE.internalRoute,
    );
  });

  it("keeps ordinary empty-source messages compact", () => {
    const mapped = mapMessageRowToDomain(row({ sources: [] }));
    assert.equal(mapped.ok, true);
    if (!mapped.ok) return;

    assert.equal("sources" in mapped.data, false);
  });

  it("fails closed on malformed persisted sources", () => {
    const mapped = mapMessageRowToDomain(
      row({
        sources: [
          {
            ...LEARNING_SOURCE,
            internalRoute: "javascript:alert(1)",
          },
        ],
      }),
    );
    assert.equal(mapped.ok, false);
    if (!mapped.ok) {
      assert.equal(mapped.error.code, "persistence_failed");
    }
  });

  it("rejects source payloads attached to non-assistant/non-completed rows", () => {
    const user = mapMessageRowToDomain(
      row({ role: "user", content: "Hej", completion_status: "completed" }),
    );
    assert.equal(user.ok, false);

    const failedAssistant = mapMessageRowToDomain(
      row({ completion_status: "failed" }),
    );
    assert.equal(failedAssistant.ok, false);
  });
});

describe("DivBrain browser-safe transcript sources", () => {
  it("exposes only display-safe source metadata", () => {
    const mapped = mapMessageRowToDomain(row());
    assert.equal(mapped.ok, true);
    if (!mapped.ok) return;

    const item = mapDivBrainMessageToShellTranscriptItem(
      mapped.data,
      CONVERSATION_ID,
    );
    assert.ok(item);
    assert.equal(item?.kind, "assistant_message");
    if (!item || item.kind !== "assistant_message") return;

    assert.equal(item.sources?.length, 1);
    const browserSource = item.sources?.[0];
    assert.deepEqual(browserSource, {
      id: LEARNING_SOURCE.id,
      title: LEARNING_SOURCE.title,
      publisher: LEARNING_SOURCE.publisher,
      attribution: LEARNING_SOURCE.attribution,
      internalRoute: LEARNING_SOURCE.internalRoute,
    });

    const serialized = JSON.stringify(browserSource);
    assert.equal(serialized.includes("excerpt"), false);
    assert.equal(serialized.includes("recordRef"), false);
    assert.equal(serialized.includes("dataAsOf"), false);
    assert.equal(serialized.includes(LEARNING_SOURCE.excerpt), false);
  });

  it("does not expose sources on terminal/error transcript states", () => {
    const message = mapMessageRowToDomain(row({ sources: [] }));
    assert.equal(message.ok, true);
    if (!message.ok) return;

    const failed = mapDivBrainMessageToShellTranscriptItem(
      {
        ...message.data,
        completionStatus: "failed",
        content: "raw provider detail",
        sources: [LEARNING_SOURCE],
      },
      CONVERSATION_ID,
    );
    assert.equal(failed?.kind, "failed");
    assert.equal(JSON.stringify(failed).includes(LEARNING_SOURCE.id), false);
  });
});

describe("DivBrain transcript source UI boundaries", () => {
  it("renders escaped links and removes stale disabled-composer copy", () => {
    const source = readFileSync(
      join(__dirname, "../../../../components/brain/DivBrainTranscript.tsx"),
      "utf8",
    );

    assert.equal(source.includes("Källor"), true);
    assert.equal(source.includes("source.internalRoute"), true);
    assert.equal(source.includes("source.canonicalUrl"), true);
    assert.equal(source.includes('rel="noopener noreferrer"'), true);
    assert.equal(source.includes("dangerouslySetInnerHTML"), false);
    assert.equal(source.includes("Frågefunktionen öppnas i nästa steg"), false);
    assert.equal(source.includes("Ställ en fråga"), true);
  });
});
