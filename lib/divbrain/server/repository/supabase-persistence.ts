/**
 * Supabase adapter for the DivBrain persistence port.
 *
 * Uses explicit column selection. Every conversation mutation/read is scoped
 * by both resource id and actor user_id. Message inserts are allowlisted.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DIVBRAIN_CONVERSATION_SELECT_COLUMNS,
  DIVBRAIN_MESSAGE_SELECT_COLUMNS,
  type DivBrainConversationRow,
  type DivBrainMessageRow,
} from "./rows";
import { isConversationRow, isMessageRow } from "./mapping";
import type {
  DivBrainConversationInsert,
  DivBrainConversationUpdatePatch,
  DivBrainListConversationsQuery,
  DivBrainListMessagesQuery,
  DivBrainMessageInsert,
  DivBrainPersistenceError,
  DivBrainPersistencePort,
  DivBrainPersistenceResult,
} from "./persistence";
import { classifyPostgrestFailure } from "./postgrest-failure";

type LooseClient = SupabaseClient;

function failed(
  kind: DivBrainPersistenceError["kind"],
): DivBrainPersistenceResult<never> {
  return { ok: false, error: { kind } };
}

function mapPostgrestError(error: {
  message?: string;
  code?: string;
} | null): DivBrainPersistenceResult<never> {
  return failed(classifyPostgrestFailure(error));
}

function applyConversationCursorFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  cursor: { updatedAt: string; id: string },
) {
  // (updated_at, id) < (cursor.updatedAt, cursor.id) in DESC order
  return query.or(
    `updated_at.lt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.lt.${cursor.id})`,
  );
}

function applyMessageCursorFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  cursor: { createdAt: string; id: string },
) {
  // (created_at, id) > (cursor.createdAt, cursor.id) in ASC order
  return query.or(
    `created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`,
  );
}

export function createSupabaseDivBrainPersistencePort(
  client: LooseClient,
): DivBrainPersistencePort {
  return {
    async insertConversation(
      input: DivBrainConversationInsert,
    ): Promise<DivBrainPersistenceResult<DivBrainConversationRow>> {
      const insertPayload: DivBrainConversationInsert = {
        user_id: input.user_id,
        title: input.title,
      };

      if (input.summary !== undefined) {
        insertPayload.summary = input.summary;
      }

      if (input.archived_at !== undefined) {
        insertPayload.archived_at = input.archived_at;
      }

      const { data, error } = await client
        .from("divbrain_conversations")
        .insert(insertPayload)
        .select(DIVBRAIN_CONVERSATION_SELECT_COLUMNS)
        .single();

      if (error) {
        return mapPostgrestError(error);
      }

      if (!isConversationRow(data)) {
        return failed("malformed_response");
      }

      return { ok: true, data };
    },

    async findConversationForActor(params) {
      const { data, error } = await client
        .from("divbrain_conversations")
        .select(DIVBRAIN_CONVERSATION_SELECT_COLUMNS)
        .eq("id", params.conversationId)
        .eq("user_id", params.userId)
        .maybeSingle();

      if (error) {
        return mapPostgrestError(error);
      }

      if (data === null) {
        return { ok: true, data: null };
      }

      if (!isConversationRow(data)) {
        return failed("malformed_response");
      }

      return { ok: true, data };
    },

    async listConversationsForActor(query: DivBrainListConversationsQuery) {
      let builder = client
        .from("divbrain_conversations")
        .select(DIVBRAIN_CONVERSATION_SELECT_COLUMNS)
        .eq("user_id", query.userId);

      if (query.archiveFilter === "active") {
        builder = builder.is("archived_at", null);
      } else if (query.archiveFilter === "archived") {
        builder = builder.not("archived_at", "is", null);
      }

      if (query.cursor) {
        builder = applyConversationCursorFilter(builder, query.cursor);
      }

      const { data, error } = await builder
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(query.limit);

      if (error) {
        return mapPostgrestError(error);
      }

      if (!Array.isArray(data)) {
        return failed("malformed_response");
      }

      if (!data.every(isConversationRow)) {
        return failed("malformed_response");
      }

      return { ok: true, data };
    },

    async updateConversationForActor(params: {
      conversationId: string;
      userId: string;
      patch: DivBrainConversationUpdatePatch;
    }) {
      const patch: DivBrainConversationUpdatePatch = {};

      if (params.patch.title !== undefined) {
        patch.title = params.patch.title;
      }

      if (params.patch.summary !== undefined) {
        patch.summary = params.patch.summary;
      }

      if (params.patch.archived_at !== undefined) {
        patch.archived_at = params.patch.archived_at;
      }

      const { data, error } = await client
        .from("divbrain_conversations")
        .update(patch)
        .eq("id", params.conversationId)
        .eq("user_id", params.userId)
        .select(DIVBRAIN_CONVERSATION_SELECT_COLUMNS)
        .maybeSingle();

      if (error) {
        return mapPostgrestError(error);
      }

      if (data === null) {
        return { ok: true, data: null };
      }

      if (!isConversationRow(data)) {
        return failed("malformed_response");
      }

      return { ok: true, data };
    },

    async deleteConversationForActor(params) {
      const { data, error } = await client
        .from("divbrain_conversations")
        .delete()
        .eq("id", params.conversationId)
        .eq("user_id", params.userId)
        .select(DIVBRAIN_CONVERSATION_SELECT_COLUMNS)
        .maybeSingle();

      if (error) {
        return mapPostgrestError(error);
      }

      if (data === null) {
        return { ok: true, data: null };
      }

      if (!isConversationRow(data)) {
        return failed("malformed_response");
      }

      return { ok: true, data };
    },

    async listMessagesForConversation(query: DivBrainListMessagesQuery) {
      let builder = client
        .from("divbrain_messages")
        .select(DIVBRAIN_MESSAGE_SELECT_COLUMNS)
        .eq("conversation_id", query.conversationId);

      if (query.cursor) {
        builder = applyMessageCursorFilter(builder, query.cursor);
      }

      const { data, error } = await builder
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(query.limit);

      if (error) {
        return mapPostgrestError(error);
      }

      if (!Array.isArray(data)) {
        return failed("malformed_response");
      }

      if (!data.every(isMessageRow)) {
        return failed("malformed_response");
      }

      return { ok: true, data };
    },

    async insertMessage(
      input: DivBrainMessageInsert,
    ): Promise<DivBrainPersistenceResult<DivBrainMessageRow>> {
      const insertPayload: Record<string, unknown> = {
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        completion_status: input.completion_status,
      };

      if (input.safety_classification !== undefined) {
        insertPayload.safety_classification = input.safety_classification;
      }

      if (input.sources !== undefined) {
        insertPayload.sources = input.sources;
      }

      if (input.error_code !== undefined) {
        insertPayload.error_code = input.error_code;
      }

      const { data, error } = await client
        .from("divbrain_messages")
        .insert(insertPayload)
        .select(DIVBRAIN_MESSAGE_SELECT_COLUMNS)
        .single();

      if (error) {
        return mapPostgrestError(error);
      }

      if (!isMessageRow(data)) {
        return failed("malformed_response");
      }

      return { ok: true, data };
    },
  };
}
