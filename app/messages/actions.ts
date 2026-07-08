"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  getProfileByUserId,
  getProfileByUsername,
} from "@/lib/messages/messages";
import {
  MESSAGE_BODY_MAX_LENGTH,
  type MessageActionState,
} from "@/lib/messages/types";
import { createClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function validateMessageBody(body: string) {
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    return {
      body: "",
      error: "Skriv ett meddelande innan du skickar.",
    };
  }

  if (normalizedBody.length > MESSAGE_BODY_MAX_LENGTH) {
    return {
      body: "",
      error: `Meddelandet får vara högst ${MESSAGE_BODY_MAX_LENGTH} tecken.`,
    };
  }

  return {
    body: normalizedBody,
    error: null,
  };
}

export async function startConversationAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const user = await requireAuthenticatedUser();
  const targetUserId = getFormString(formData, "targetUserId").trim();
  const username = getFormString(formData, "username")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const messageValidation = validateMessageBody(getFormString(formData, "body"));

  if (messageValidation.error) {
    return {
      status: "error",
      message: messageValidation.error,
    };
  }

  const targetProfile = targetUserId
    ? await getProfileByUserId(targetUserId)
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
    "get_or_create_private_conversation",
    {
      p_target_user_id: targetProfile.id,
      p_initial_body: messageValidation.body,
    },
  );

  if (error || !conversationId) {
    return {
      status: "error",
      message: "Konversationen kunde inte startas. Försök igen.",
    };
  }

  revalidatePath("/messages");
  redirect(`/messages/${conversationId}`);
}

export async function sendMessageAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const user = await requireAuthenticatedUser();
  const conversationId = getFormString(formData, "conversationId").trim();
  const messageValidation = validateMessageBody(getFormString(formData, "body"));

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
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: messageValidation.body,
  });

  if (error) {
    return {
      status: "error",
      message: "Meddelandet kunde inte skickas. Försök igen.",
    };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  redirect(`/messages/${conversationId}`);
}
