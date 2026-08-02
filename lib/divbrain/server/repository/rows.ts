/**
 * Narrow DivBrain persistence row shapes mirroring Ticket 1A-6 migration.
 * These are not generated Supabase types — they mirror
 * `supabase/migrations/20260719110800_create_divbrain_conversations_and_messages.sql`.
 *
 * Keep distinguishable from shared domain models in `lib/divbrain/types.ts`.
 */

import type {
  DivBrainCompletionStatus,
  DivBrainMessageRole,
} from "../../types";
import type { DivBrainGuardrailDecision } from "../../guardrails";
import type { DivBrainErrorCode } from "../../errors";

/** Persistence row for `public.divbrain_conversations`. */
export type DivBrainConversationRow = {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  schema_version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

/** Persistence row for `public.divbrain_messages`. */
export type DivBrainMessageRow = {
  id: string;
  conversation_id: string;
  role: DivBrainMessageRole;
  content: string;
  completion_status: DivBrainCompletionStatus;
  safety_classification: DivBrainGuardrailDecision | null;
  sources: unknown;
  error_code: DivBrainErrorCode | null;
  created_at: string;
};

export const DIVBRAIN_CONVERSATION_SELECT_COLUMNS =
  "id, user_id, title, summary, schema_version, created_at, updated_at, archived_at" as const;

export const DIVBRAIN_MESSAGE_SELECT_COLUMNS =
  "id, conversation_id, role, content, completion_status, safety_classification, sources, error_code, created_at" as const;
