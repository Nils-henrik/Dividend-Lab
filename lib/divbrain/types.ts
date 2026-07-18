/**
 * DivBrain shared domain types.
 * Safe for server and client. Ownership is never accepted from client input —
 * it is derived later from the authenticated server session.
 *
 * Intentionally omitted: hidden reasoning / chain-of-thought, emails,
 * auth tokens, owner/user ids on inputs, provider objects, DB row shapes.
 * Source/citation models live in `sources.ts` / `citations.ts`.
 * Safety classification remains a later-ticket extension point.
 */

import {
  DIVBRAIN_COMPLETION_STATUSES,
  DIVBRAIN_MESSAGE_ROLES,
} from "./constants";

export type DivBrainConversationId = string;
export type DivBrainMessageId = string;

/**
 * Internal domain roles. `system` is server-controlled only:
 * - browser input must never supply system-policy text
 * - including `system` in this union does not authorize client creation
 *   or browser exposure of policy/system prompts
 */
export type DivBrainMessageRole = (typeof DIVBRAIN_MESSAGE_ROLES)[number];

export type DivBrainCompletionStatus =
  (typeof DIVBRAIN_COMPLETION_STATUSES)[number];

/**
 * Domain conversation suitable for later persistence.
 * Owner identity is session-derived and not part of this public shape.
 */
export type DivBrainConversation = {
  id: DivBrainConversationId;
  title: string;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

/**
 * Domain message. Grounded assistant payloads use
 * `DivBrainGroundedAnswer` in `citations.ts` rather than forcing sources
 * onto every message instance. Do not store hidden reasoning here.
 */
export type DivBrainMessage = {
  id: DivBrainMessageId;
  conversationId: DivBrainConversationId;
  role: DivBrainMessageRole;
  content: string;
  completionStatus: DivBrainCompletionStatus;
  createdAt: string;
};

/** Client-facing input: create conversation. No owner/user id. */
export type CreateConversationInput = {
  title?: string;
};

/** Client-facing input: rename conversation. No owner/user id. */
export type RenameConversationInput = {
  conversationId: DivBrainConversationId;
  title: string;
};

/**
 * Client-facing input: submit message content.
 * No owner/user id, role, completion status, safety classification,
 * or provider metadata — the server assigns role as `user`.
 */
export type SubmitMessageInput = {
  conversationId: DivBrainConversationId;
  content: string;
};
