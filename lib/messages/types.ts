import type { ConversationMessageAttachment } from "./attachments";

export const MESSAGE_BODY_MAX_LENGTH = 2000;
export const MESSAGE_SUBJECT_MAX_LENGTH = 120;

export type ConversationStatus =
  | "message_request"
  | "active"
  | "ignored"
  | "declined";

export type MessageParticipant = {
  id: string;
  name: string;
  username: string | null;
  initials: string;
  avatarUrl: string | null;
};

export type ConversationSummary = {
  id: string;
  subject: string | null;
  status: ConversationStatus;
  initiatedBy: string | null;
  updatedAt: string;
  otherParticipant: MessageParticipant | null;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  hasUnread: boolean;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  hasAttachments: boolean;
  attachments: ConversationMessageAttachment[];
};

export type ConversationThread = {
  id: string;
  subject: string | null;
  status: ConversationStatus;
  initiatedBy: string | null;
  otherParticipant: MessageParticipant | null;
  messages: ConversationMessage[];
  canSend: boolean;
  isMessageRequestRecipient: boolean;
  isPendingRequestSender: boolean;
};

export type MessageActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type PresenceKind = "online" | "recent" | "offline";

export type PresenceSnapshot = {
  userId: string;
  lastSeenAt: string | null;
  shareActiveStatus: boolean;
};

export type PresenceView = {
  kind: PresenceKind;
  lastSeenAt: string | null;
  compactLabel: string | null;
  srLabel: string | null;
};

export type ChatContact = {
  userId: string;
  name: string;
  username: string | null;
  initials: string;
  avatarUrl: string | null;
  conversationId: string | null;
  hasUnread: boolean;
  lastActivityAt: string | null;
};

export type GlobalChatBootstrap = {
  currentUserId: string;
  contacts: ChatContact[];
  chats: ConversationSummary[];
  requests: ConversationSummary[];
  unreadCount: number;
  shareActiveStatus: boolean;
  presenceByUserId: Record<string, PresenceSnapshot>;
};

export type ChatMutationResult<T = undefined> = {
  status: "success" | "error";
  message: string;
  data?: T;
};
