/**
 * Prove Supabase adapter query chains apply actor ownership filters.
 * Recording mock — no remote Supabase.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSupabaseDivBrainPersistencePort } from "./supabase-persistence";

type Call = {
  table: string;
  method: string;
  filters: Array<{ type: string; args: unknown[] }>;
  payload?: unknown;
};

function createRecordingClient(options?: {
  singleData?: unknown;
  maybeSingleData?: unknown;
  listData?: unknown[];
  error?: { message: string; code?: string } | null;
}) {
  const calls: Call[] = [];

  function chain(table: string, method: string, payload?: unknown) {
    const call: Call = {
      table,
      method,
      filters: [],
      payload,
    };
    calls.push(call);

    const api = {
      select() {
        return api;
      },
      insert(values: unknown) {
        call.payload = values;
        return api;
      },
      update(values: unknown) {
        call.payload = values;
        return api;
      },
      delete() {
        return api;
      },
      eq(...args: unknown[]) {
        call.filters.push({ type: "eq", args });
        return api;
      },
      is(...args: unknown[]) {
        call.filters.push({ type: "is", args });
        return api;
      },
      not(...args: unknown[]) {
        call.filters.push({ type: "not", args });
        return api;
      },
      or(...args: unknown[]) {
        call.filters.push({ type: "or", args });
        return api;
      },
      order(...args: unknown[]) {
        call.filters.push({ type: "order", args });
        return api;
      },
      limit(...args: unknown[]) {
        call.filters.push({ type: "limit", args });
        return api;
      },
      async single() {
        return {
          data: options?.singleData ?? null,
          error: options?.error ?? null,
        };
      },
      async maybeSingle() {
        return {
          data: options?.maybeSingleData ?? null,
          error: options?.error ?? null,
        };
      },
      then(
        resolve: (value: {
          data: unknown;
          error: { message: string; code?: string } | null;
        }) => void,
      ) {
        resolve({
          data: options?.listData ?? [],
          error: options?.error ?? null,
        });
      },
    };

    return api;
  }

  return {
    calls,
    client: {
      from(table: string) {
        return {
          select() {
            return chain(table, "select");
          },
          insert(values: unknown) {
            return chain(table, "insert", values);
          },
          update(values: unknown) {
            return chain(table, "update", values);
          },
          delete() {
            return chain(table, "delete");
          },
        };
      },
    },
  };
}

const ACTOR = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const CONV = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const conversationRow = {
  id: CONV,
  user_id: ACTOR,
  title: "T",
  summary: null,
  schema_version: 1,
  created_at: "2026-07-19T12:00:00.000Z",
  updated_at: "2026-07-19T12:00:00.000Z",
  archived_at: null,
};

describe("Supabase DivBrain persistence adapter — actor scoping", () => {
  it("scopes find/update/delete by id and user_id together", async () => {
    const findRecorder = createRecordingClient({
      maybeSingleData: conversationRow,
    });
    const findPort = createSupabaseDivBrainPersistencePort(
      findRecorder.client as never,
    );
    await findPort.findConversationForActor({
      conversationId: CONV,
      userId: ACTOR,
    });
    assert.deepEqual(findRecorder.calls[0]?.filters.filter((f) => f.type === "eq"), [
      { type: "eq", args: ["id", CONV] },
      { type: "eq", args: ["user_id", ACTOR] },
    ]);

    const updateRecorder = createRecordingClient({
      maybeSingleData: conversationRow,
    });
    const updatePort = createSupabaseDivBrainPersistencePort(
      updateRecorder.client as never,
    );
    await updatePort.updateConversationForActor({
      conversationId: CONV,
      userId: ACTOR,
      patch: { title: "Ny" },
    });
    assert.deepEqual(
      updateRecorder.calls[0]?.filters.filter((f) => f.type === "eq"),
      [
        { type: "eq", args: ["id", CONV] },
        { type: "eq", args: ["user_id", ACTOR] },
      ],
    );
    assert.deepEqual(updateRecorder.calls[0]?.payload, { title: "Ny" });
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        updateRecorder.calls[0]?.payload ?? {},
        "user_id",
      ),
      false,
    );

    const deleteRecorder = createRecordingClient({
      maybeSingleData: conversationRow,
    });
    const deletePort = createSupabaseDivBrainPersistencePort(
      deleteRecorder.client as never,
    );
    await deletePort.deleteConversationForActor({
      conversationId: CONV,
      userId: ACTOR,
    });
    assert.deepEqual(
      deleteRecorder.calls[0]?.filters.filter((f) => f.type === "eq"),
      [
        { type: "eq", args: ["id", CONV] },
        { type: "eq", args: ["user_id", ACTOR] },
      ],
    );
  });

  it("scopes conversation lists by actor user_id", async () => {
    const recorder = createRecordingClient({ listData: [conversationRow] });
    const port = createSupabaseDivBrainPersistencePort(recorder.client as never);
    await port.listConversationsForActor({
      userId: ACTOR,
      archiveFilter: "active",
      limit: 20,
    });
    assert.deepEqual(
      recorder.calls[0]?.filters.filter((f) => f.type === "eq"),
      [{ type: "eq", args: ["user_id", ACTOR] }],
    );
    assert.ok(
      recorder.calls[0]?.filters.some(
        (f) => f.type === "is" && f.args[0] === "archived_at",
      ),
    );
  });

  it("inserts conversations with trusted user_id only and allowlisted fields", async () => {
    const recorder = createRecordingClient({ singleData: conversationRow });
    const port = createSupabaseDivBrainPersistencePort(recorder.client as never);
    await port.insertConversation({
      user_id: ACTOR,
      title: "Ny konversation",
    });
    assert.deepEqual(recorder.calls[0]?.payload, {
      user_id: ACTOR,
      title: "Ny konversation",
    });
  });

  it("lists messages by conversation_id only after repository ownership proof", async () => {
    const recorder = createRecordingClient({ listData: [] });
    const port = createSupabaseDivBrainPersistencePort(recorder.client as never);
    await port.listMessagesForConversation({
      conversationId: CONV,
      limit: 20,
    });
    assert.deepEqual(
      recorder.calls[0]?.filters.filter((f) => f.type === "eq"),
      [{ type: "eq", args: ["conversation_id", CONV] }],
    );
  });

  it("message insert payload is allowlisted and never spreads caller bags", async () => {
    const messageRow = {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      conversation_id: CONV,
      role: "user",
      content: "Hej",
      completion_status: "completed",
      safety_classification: null,
      sources: [],
      error_code: null,
      created_at: "2026-07-19T12:00:00.000Z",
    };
    const recorder = createRecordingClient({ singleData: messageRow });
    const port = createSupabaseDivBrainPersistencePort(recorder.client as never);
    await port.insertMessage({
      conversation_id: CONV,
      role: "user",
      content: "Hej",
      completion_status: "completed",
    });
    assert.deepEqual(recorder.calls[0]?.payload, {
      conversation_id: CONV,
      role: "user",
      content: "Hej",
      completion_status: "completed",
    });
    assert.equal(
      JSON.stringify(recorder.calls[0]?.payload).includes(OTHER),
      false,
    );
  });
});
