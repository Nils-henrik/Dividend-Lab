import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  areAcceptedContacts,
  findConversationIdBetweenUsers,
  getConversationThread,
  getProfileByUserId,
  getProfileByUsername,
  markConversationRead,
} from "./messages";
import type {
  ChatMutationResult,
  ConversationMessage,
  ConversationThread,
} from "./types";
import {
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
};

function mapMessageRow(row: MessageRow): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function sendPrivateMessageMutation(
  conversationId: string,
  body: string,
): Promise<ChatMutationResult<ConversationMessage>> {
  await requireAuthenticatedUser();
  const messageValidation = validateMessageBody(body, { required: true });

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
  const { data, error } = await supabase.rpc("send_private_message", {
    p_conversation_id: conversationId,
    p_body: messageValidation.body,
  });

  if (error || !data) {
    return {
      status: "error",
      message: "Det gick inte att skicka meddelandet. Försök igen.",
    };
  }

  return {
    status: "success",
    message: "Meddelandet skickades.",
    data: mapMessageRow(data as MessageRow),
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
