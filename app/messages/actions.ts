"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  acceptMessageRequestMutation,
  declineMessageRequestMutation,
  ignoreMessageRequestMutation,
  loadConversationThreadMutation,
  markConversationReadMutation,
  openAcceptedContactConversationMutation,
  sendPrivateMessageMutation,
  startConversationMutation,
} from "@/lib/messages/mutations";
import {
  findConversationIdBetweenUsers,
  getProfileByUserId,
} from "@/lib/messages/messages";
import type { ChatMutationResult, ConversationThread, MessageActionState } from "@/lib/messages/types";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function revalidateConversation(conversationId?: string) {
  revalidatePath("/messages");
  if (conversationId) {
    revalidatePath(`/messages/${conversationId}`);
  }
}

export async function openConversationWithUserAction(targetUserId: string) {
  const user = await requireAuthenticatedUser();

  if (!targetUserId || targetUserId === user.id) {
    redirect("/messages");
  }

  const existingId = await findConversationIdBetweenUsers(user.id, targetUserId);
  if (existingId) {
    redirect(`/messages/${existingId}`);
  }

  const opened = await openAcceptedContactConversationMutation(targetUserId);
  if (opened.status === "success" && opened.data?.conversationId) {
    revalidateConversation(opened.data.conversationId);
    redirect(`/messages/${opened.data.conversationId}`);
  }

  const profile = await getProfileByUserId(targetUserId);
  if (profile?.username) {
    redirect(`/messages/new?username=${encodeURIComponent(profile.username)}`);
  }

  redirect(`/messages/new?userId=${encodeURIComponent(targetUserId)}`);
}

export async function startConversationAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const result = await startConversationMutation({
    targetUserId: getFormString(formData, "targetUserId").trim(),
    username: getFormString(formData, "username"),
    subject: getFormString(formData, "subject"),
    body: getFormString(formData, "body"),
  });

  if (result.status === "error" || !result.data?.conversationId) {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidateConversation(result.data.conversationId);
  redirect(`/messages/${result.data.conversationId}`);
}

export async function sendMessageAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const conversationId = getFormString(formData, "conversationId").trim();
  const result = await sendPrivateMessageMutation(
    conversationId,
    getFormString(formData, "body"),
  );

  if (result.status === "error") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidateConversation(conversationId);
  redirect(`/messages/${conversationId}`);
}

export async function acceptMessageRequestAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const conversationId = getFormString(formData, "conversationId").trim();
  const result = await acceptMessageRequestMutation(conversationId);

  if (result.status === "error") {
    return result;
  }

  revalidateConversation(conversationId);
  return result;
}

export async function ignoreMessageRequestAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const conversationId = getFormString(formData, "conversationId").trim();
  const result = await ignoreMessageRequestMutation(conversationId);

  if (result.status === "error") {
    return result;
  }

  revalidateConversation(conversationId);
  redirect("/messages?tab=requests");
}

export async function declineMessageRequestAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const conversationId = getFormString(formData, "conversationId").trim();
  const result = await declineMessageRequestMutation(conversationId);

  if (result.status === "error") {
    return result;
  }

  revalidateConversation(conversationId);
  redirect("/messages?tab=requests");
}

export async function sendChatMessageAction(
  conversationId: string,
  body: string,
) {
  const result = await sendPrivateMessageMutation(conversationId, body);
  if (result.status === "success") {
    revalidateConversation(conversationId);
  }
  return result;
}

export async function openChatWithContactAction(targetUserId: string) {
  const opened = await openAcceptedContactConversationMutation(targetUserId);
  if (opened.status === "error" || !opened.data?.conversationId) {
    return opened;
  }

  const thread = await loadConversationThreadMutation(opened.data.conversationId, {
    markRead: true,
  });

  if (thread.status === "error" || !thread.data) {
    return {
      status: "error" as const,
      message: thread.message,
    };
  }

  revalidateConversation(opened.data.conversationId);
  return {
    status: "success" as const,
    message: opened.message,
    data: {
      conversationId: opened.data.conversationId,
      thread: thread.data,
    },
  };
}

export async function loadChatThreadAction(conversationId: string) {
  const result = await loadConversationThreadMutation(conversationId, {
    markRead: true,
  });
  if (result.status === "success") {
    revalidateConversation(conversationId);
  }
  return result;
}

export async function peekChatThreadAction(conversationId: string) {
  return loadConversationThreadMutation(conversationId, { markRead: false });
}

export async function markChatConversationReadAction(conversationId: string) {
  return markConversationReadMutation(conversationId);
}

export async function acceptChatRequestAction(conversationId: string) {
  const result = await acceptMessageRequestMutation(conversationId);
  if (result.status === "success") {
    revalidateConversation(conversationId);
  }
  return result;
}

export async function ignoreChatRequestAction(conversationId: string) {
  const result = await ignoreMessageRequestMutation(conversationId);
  if (result.status === "success") {
    revalidateConversation(conversationId);
  }
  return result;
}

export async function declineChatRequestAction(conversationId: string) {
  const result = await declineMessageRequestMutation(conversationId);
  if (result.status === "success") {
    revalidateConversation(conversationId);
  }
  return result;
}

export async function startChatConversationAction(input: {
  targetUserId?: string;
  username?: string;
  subject?: string;
  body: string;
}): Promise<ChatMutationResult<{ conversationId: string; thread: ConversationThread }>> {
  const result = await startConversationMutation(input);
  if (result.status === "error" || !result.data?.conversationId) {
    return {
      status: "error",
      message: result.message,
    };
  }

  const thread = await loadConversationThreadMutation(result.data.conversationId, {
    markRead: true,
  });

  if (thread.status === "error" || !thread.data) {
    return {
      status: "error",
      message: thread.message,
    };
  }

  revalidateConversation(result.data.conversationId);
  return {
    status: "success",
    message: result.message,
    data: {
      conversationId: result.data.conversationId,
      thread: thread.data,
    },
  };
}

