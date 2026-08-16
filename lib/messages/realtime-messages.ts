import type { ConversationMessage, ConversationSummary } from "./types";

export function mergeRealtimeMessage(
  messages: ConversationMessage[],
  incoming: ConversationMessage,
): ConversationMessage[] {
  if (messages.some((message) => message.id === incoming.id)) {
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

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
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

  return summaries
    .map((summary) =>
      summary.id === message.conversationId
        ? {
            ...summary,
            lastMessagePreview: message.body,
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
