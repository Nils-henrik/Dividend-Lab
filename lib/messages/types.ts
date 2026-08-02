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
