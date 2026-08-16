import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CHAT_ATTACHMENT_MAX_PER_MESSAGE } from "./attachments";
import {
  areAcceptedContacts,
  findConversationIdBetweenUsers,
  getConversationThread,
  getProfileByUserId,
  getProfileByUsername,
  markConversationRead,
} from "./messages";
import { mapConversationMessage } from "./realtime-messages";
import { createChatServiceRoleAttachmentRepository } from "./server/attachments/wiring";
import { chatAttachmentSafeMessage } from "./server/attachments/validation";
import type {
  ChatMutationResult,
  ConversationMessage,
  ConversationThread,
} from "./types";
import {
  parseChatAttachmentIds,
  validateConversationSubject,
  validateMessageBody,
} from "./validation";

export { validateConversationSubject, validateMessageBody };

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  has_attachments?: boolean | null;
};

function mapMessageRow(
  row: MessageRow,
  attachments: ConversationMessage["attachments"] = [],
): ConversationMessage {
  return mapConversationMessage({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    hasAttachments: Boolean(row.has_attachments) || attachments.length > 0,
    attachments,
  });
}

export async function sendPrivateMessageMutation(
  conversationId: string,
  body: string,
  attachmentIds: readonly string[] = [],
): Promise<ChatMutationResult<ConversationMessage>> {
  const user = await requireAuthenticatedUser();
  const parsedIds = parseChatAttachmentIds([...attachmentIds]);
  if (parsedIds.error) {
    return { status: "error", message: parsedIds.error };
  }

  if (parsedIds.ids.length > CHAT_ATTACHMENT_MAX_PER_MESSAGE) {
    return {
      status: "error",
      message: "Du kan bifoga högst 3 filer per meddelande.",
    };
  }

  const messageValidation = validateMessageBody(body, {
    required: parsedIds.ids.length === 0,
  });

  if (!conversationId) {
    return {
      status: "error",
      message: "Konversationen saknas. Öppna inkorgen och försök igen.",
    };
  }

  if (messageValidation.error) {
    return {
      status: "error",
      message: messageValidation.error,
    };
  }

  const supabase = await createClient();
  const { data, error } =
    parsedIds.ids.length === 0
      ? await supabase.rpc("send_private_message", {
          p_conversation_id: conversationId,
          p_body: messageValidation.body,
        })
      : await supabase.rpc("send_private_message_with_attachments", {
          p_conversation_id: conversationId,
          p_body: messageValidation.body,
          p_attachment_ids: parsedIds.ids,
        });

  if (error || !data) {
    return {
      status: "error",
      message: "Det gick inte att skicka meddelandet. Försök igen.",
    };
  }

  const row = data as MessageRow;
  let attachments: ConversationMessage["attachments"] = [];
  if (parsedIds.ids.length > 0) {
    const thread = await getConversationThread(user.id, conversationId);
    attachments =
      thread?.messages.find((message) => message.id === row.id)?.attachments ??
      [];
  }

  return {
    status: "success",
    message: "Meddelandet skickades.",
    data: mapMessageRow(row, attachments),
  };
}

export async function prepareChatAttachmentUploadMutation(input: {
  conversationId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
}): Promise<
  ChatMutationResult<{
    attachmentId: string;
    signedUrl: string;
    token: string;
    shell: ConversationMessage["attachments"][number];
  }>
> {
  const user = await requireAuthenticatedUser();
  if (!input.conversationId) {
    return { status: "error", message: "Konversationen saknas." };
  }

  const supabase = await createClient();
  const { data: canSend, error: canSendError } = await supabase.rpc(
    "can_send_private_message",
    {
      p_conversation_id: input.conversationId,
      p_user_id: user.id,
    },
  );
  if (canSendError || !canSend) {
    return {
      status: "error",
      message: "Du kan inte skicka meddelanden i den här konversationen just nu.",
    };
  }

  const repository = createChatServiceRoleAttachmentRepository();
  if (!repository.ok) {
    return {
      status: "error",
      message: "Det gick inte att ladda upp filen. Försök igen.",
    };
  }

  const prepared = await repository.data.prepareUpload({
    actorId: user.id,
    conversationId: input.conversationId,
    filename: input.filename,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });
  if (!prepared.ok) {
    return {
      status: "error",
      message: chatAttachmentSafeMessage(prepared.clientError),
    };
  }

  return {
    status: "success",
    message: "Uppladdning förberedd.",
    data: prepared,
  };
}

export async function confirmChatAttachmentUploadMutation(input: {
  attachmentId: string;
}): Promise<
  ChatMutationResult<{ shell: ConversationMessage["attachments"][number] }>
> {
  const user = await requireAuthenticatedUser();
  const repository = createChatServiceRoleAttachmentRepository();
  if (!repository.ok) {
    return {
      status: "error",
      message: "Det gick inte att ladda upp filen. Försök igen.",
    };
  }

  const confirmed = await repository.data.confirmUpload({
    actorId: user.id,
    attachmentId: input.attachmentId,
  });
  if (!confirmed.ok) {
    return {
      status: "error",
      message: chatAttachmentSafeMessage(confirmed.clientError),
    };
  }

  return {
    status: "success",
    message: "Filen är uppladdad.",
    data: { shell: confirmed.shell },
  };
}

export async function discardChatUnlinkedAttachmentMutation(input: {
  attachmentId: string;
}): Promise<ChatMutationResult> {
  const user = await requireAuthenticatedUser();
  const repository = createChatServiceRoleAttachmentRepository();
  if (!repository.ok) {
    return {
      status: "error",
      message: "Bilagan kunde inte tas bort. Försök igen.",
    };
  }

  const discarded = await repository.data.discardUnlinkedAttachment({
    actorId: user.id,
    attachmentId: input.attachmentId,
  });
  if (!discarded.ok) {
    return {
      status: "error",
      message: chatAttachmentSafeMessage(discarded.clientError),
    };
  }

  return {
    status: "success",
    message: "Bilagan togs bort.",
  };
}

export async function hydrateChatMessageAttachmentsMutation(
  conversationId: string,
  messageId: string,
): Promise<ChatMutationResult<ConversationMessage["attachments"]>> {
  const user = await requireAuthenticatedUser();
  if (!conversationId || !messageId) {
    return { status: "error", message: "Meddelandet saknas." };
  }

  const thread = await getConversationThread(user.id, conversationId);
  if (!thread) {
    return { status: "error", message: "Konversationen kunde inte öppnas." };
  }

  const message = thread.messages.find((item) => item.id === messageId);
  return {
    status: "success",
    message: "Bilagor hämtade.",
    data: message?.attachments ?? [],
  };
}

export async function openAcceptedContactConversationMutation(
  targetUserId: string,
): Promise<ChatMutationResult<{ conversationId: string }>> {
  const user = await requireAuthenticatedUser();

  if (!targetUserId || targetUserId === user.id) {
    return {
      status: "error",
      message: "Välj en kontakt att chatta med.",
    };
  }

  const existingId = await findConversationIdBetweenUsers(user.id, targetUserId);
  if (existingId) {
    return {
      status: "success",
      message: "Konversationen är öppen.",
      data: { conversationId: existingId },
    };
  }

  const areContacts = await areAcceptedContacts(user.id, targetUserId);
  if (!areContacts) {
    return {
      status: "error",
      message: "Endast accepterade kontakter kan öppnas från kontaktlistan.",
    };
  }

  const supabase = await createClient();
  const { data: conversationId, error } = await supabase.rpc(
    "open_or_create_private_conversation",
    {
      p_target_user_id: targetUserId,
      p_initial_body: null,
      p_subject: null,
    },
  );

  if (error || !conversationId) {
    return {
      status: "error",
      message: "Konversationen kunde inte startas. Försök igen.",
    };
  }

  return {
    status: "success",
    message: "Konversationen är öppen.",
    data: { conversationId: String(conversationId) },
  };
}

export async function startConversationMutation(input: {
  targetUserId?: string;
  username?: string;
  subject?: string;
  body: string;
}): Promise<ChatMutationResult<{ conversationId: string }>> {
  const user = await requireAuthenticatedUser();
  const subjectValidation = validateConversationSubject(input.subject ?? "", {
    required: false,
  });
  const messageValidation = validateMessageBody(input.body, { required: true });

  if (subjectValidation.error) {
    return { status: "error", message: subjectValidation.error };
  }

  if (messageValidation.error) {
    return { status: "error", message: messageValidation.error };
  }

  const username = (input.username ?? "").trim().replace(/^@/, "").toLowerCase();
  const targetProfile = input.targetUserId
    ? await getProfileByUserId(input.targetUserId)
    : username
      ? await getProfileByUsername(username)
      : null;

  if (!targetProfile) {
    return {
      status: "error",
      message: "Vi hittade ingen användare med det användarnamnet.",
    };
  }

  if (targetProfile.id === user.id) {
    return {
      status: "error",
      message: "Du kan inte starta en konversation med dig själv.",
    };
  }

  const supabase = await createClient();
  const { data: conversationId, error } = await supabase.rpc(
    "open_or_create_private_conversation",
    {
      p_target_user_id: targetProfile.id,
      p_initial_body: messageValidation.body,
      p_subject: subjectValidation.subject || null,
    },
  );

  if (error || !conversationId) {
    const areContacts = await areAcceptedContacts(user.id, targetProfile.id);
    return {
      status: "error",
      message: areContacts
        ? "Konversationen kunde inte startas. Försök igen."
        : "Meddelandeförfrågan kunde inte skickas. Försök igen.",
    };
  }

  return {
    status: "success",
    message: "Konversationen är öppen.",
    data: { conversationId: String(conversationId) },
  };
}

export async function acceptMessageRequestMutation(
  conversationId: string,
): Promise<ChatMutationResult> {
  await requireAuthenticatedUser();

  if (!conversationId) {
    return { status: "error", message: "Förfrågan saknas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_message_request", {
    p_conversation_id: conversationId,
  });

  if (error) {
    return {
      status: "error",
      message: "Meddelandeförfrågan kunde inte accepteras. Försök igen.",
    };
  }

  return {
    status: "success",
    message: "Meddelandeförfrågan accepterad.",
  };
}

export async function ignoreMessageRequestMutation(
  conversationId: string,
): Promise<ChatMutationResult> {
  await requireAuthenticatedUser();

  if (!conversationId) {
    return { status: "error", message: "Förfrågan saknas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("ignore_message_request", {
    p_conversation_id: conversationId,
  });

  if (error) {
    return {
      status: "error",
      message: "Meddelandeförfrågan kunde inte ignoreras. Försök igen.",
    };
  }

  return {
    status: "success",
    message: "Meddelandeförfrågan ignorerad.",
  };
}

export async function declineMessageRequestMutation(
  conversationId: string,
): Promise<ChatMutationResult> {
  await requireAuthenticatedUser();

  if (!conversationId) {
    return { status: "error", message: "Förfrågan saknas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_message_request", {
    p_conversation_id: conversationId,
  });

  if (error) {
    return {
      status: "error",
      message: "Meddelandeförfrågan kunde inte nekas. Försök igen.",
    };
  }

  return {
    status: "success",
    message: "Meddelandeförfrågan nekad.",
  };
}

export async function loadConversationThreadMutation(
  conversationId: string,
  options?: { markRead?: boolean },
): Promise<ChatMutationResult<ConversationThread>> {
  const user = await requireAuthenticatedUser();

  if (!conversationId) {
    return { status: "error", message: "Konversationen saknas." };
  }

  const thread = await getConversationThread(user.id, conversationId);
  if (!thread) {
    return {
      status: "error",
      message: "Konversationen kunde inte öppnas.",
    };
  }

  if (options?.markRead) {
    await markConversationRead(user.id, conversationId);
  }

  return {
    status: "success",
    message: "Konversationen är öppen.",
    data: thread,
  };
}

export async function markConversationReadMutation(conversationId: string) {
  const user = await requireAuthenticatedUser();

  if (!conversationId) {
    return { status: "error" as const, message: "Konversationen saknas." };
  }

  await markConversationRead(user.id, conversationId);
  return { status: "success" as const, message: "Markerad som läst." };
}
