import { formatChatMessagePreview } from "./attachments";
import type { ConversationMessageAttachment } from "./attachments";
import type { ConversationMessage, ConversationSummary } from "./types";

export function mapConversationMessage(input: {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  hasAttachments?: boolean;
  attachments?: ConversationMessageAttachment[];
}): ConversationMessage {
  const attachments = input.attachments ?? [];
  return {
    id: input.id,
    conversationId: input.conversationId,
    senderId: input.senderId,
    body: input.body,
    createdAt: input.createdAt,
    hasAttachments: Boolean(input.hasAttachments) || attachments.length > 0,
    attachments,
  };
}

export function mergeMessageAttachments(
  messages: ConversationMessage[],
  messageId: string,
  attachments: ConversationMessageAttachment[],
): ConversationMessage[] {
  return messages.map((message) =>
    message.id === messageId
      ? {
          ...message,
          hasAttachments: attachments.length > 0 || message.hasAttachments,
          attachments,
        }
      : message,
  );
}

export function mergeRealtimeMessage(
  messages: ConversationMessage[],
  incoming: ConversationMessage,
): ConversationMessage[] {
  const existing = messages.find((message) => message.id === incoming.id);
  if (existing) {
    if (
      incoming.attachments.length > 0 &&
      existing.attachments.length === 0
    ) {
      return mergeMessageAttachments(
        messages,
        incoming.id,
        incoming.attachments,
      );
    }
    return messages;
  }

  return [...messages, incoming].sort((first, second) => {
    const timeDelta =
      Date.parse(first.createdAt) - Date.parse(second.createdAt);

    if (timeDelta !== 0) {
      return timeDelta;
    }

    return first.id.localeCompare(second.id);
  });
}

export function mergeRealtimeMessages(
  messages: ConversationMessage[],
  incoming: ConversationMessage[],
) {
  return incoming.reduce(mergeRealtimeMessage, messages);
}

export function mapRealtimeMessageRow(row: {
  id?: unknown;
  conversation_id?: unknown;
  sender_id?: unknown;
  body?: unknown;
  created_at?: unknown;
  has_attachments?: unknown;
}): ConversationMessage | null {
  if (
    typeof row.id !== "string" ||
    typeof row.conversation_id !== "string" ||
    typeof row.sender_id !== "string" ||
    typeof row.body !== "string" ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }

  return mapConversationMessage({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    hasAttachments: row.has_attachments === true,
    attachments: [],
  });
}

export function applyMessageToSummaries(
  summaries: ConversationSummary[],
  message: ConversationMessage,
  options: {
    currentUserId: string;
    isOpenAndVisible: boolean;
    otherParticipantName?: string | null;
  },
): ConversationSummary[] {
  const existing = summaries.find((summary) => summary.id === message.conversationId);
  const hasUnread =
    message.senderId !== options.currentUserId && !options.isOpenAndVisible;

  if (!existing) {
    return summaries;
  }

  const lastMessagePreview =
    formatChatMessagePreview(message) || existing.lastMessagePreview;

  return summaries
    .map((summary) =>
      summary.id === message.conversationId
        ? {
            ...summary,
            lastMessagePreview,
            lastMessageAt: message.createdAt,
            updatedAt: message.createdAt,
            hasUnread: hasUnread || (summary.hasUnread && !options.isOpenAndVisible),
          }
        : summary,
    )
    .sort(
      (first, second) =>
        Date.parse(second.updatedAt) - Date.parse(first.updatedAt),
    );
}
