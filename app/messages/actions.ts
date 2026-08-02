"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  areAcceptedContacts,
  findConversationIdBetweenUsers,
  getProfileByUserId,
  getProfileByUsername,
} from "@/lib/messages/messages";
import {
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_SUBJECT_MAX_LENGTH,
  type MessageActionState,
} from "@/lib/messages/types";
import { createClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function validateMessageBody(body: string, { required }: { required: boolean }) {
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    if (!required) {
      return {
        body: "",
        error: null as string | null,
      };
    }

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
    error: null as string | null,
  };
}

function validateConversationSubject(subject: string, { required }: { required: boolean }) {
  const normalizedSubject = subject.trim();

  if (!normalizedSubject) {
    if (!required) {
      return {
        subject: "",
        error: null as string | null,
      };
    }

    return {
      subject: "",
      error: "Ange ett ämne för konversationen.",
    };
  }

  if (normalizedSubject.length > MESSAGE_SUBJECT_MAX_LENGTH) {
    return {
      subject: "",
      error: `Ämnet får vara högst ${MESSAGE_SUBJECT_MAX_LENGTH} tecken.`,
    };
  }

  return {
    subject: normalizedSubject,
    error: null as string | null,
  };
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

  const areContacts = await areAcceptedContacts(user.id, targetUserId);
  if (areContacts) {
    const supabase = await createClient();
    const { data: conversationId, error } = await supabase.rpc(
      "open_or_create_private_conversation",
      {
        p_target_user_id: targetUserId,
        p_initial_body: null,
        p_subject: null,
      },
    );

    if (!error && conversationId) {
      revalidatePath("/messages");
      redirect(`/messages/${conversationId}`);
    }
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
  const user = await requireAuthenticatedUser();
  const targetUserId = getFormString(formData, "targetUserId").trim();
  const username = getFormString(formData, "username")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const subjectValidation = validateConversationSubject(
    getFormString(formData, "subject"),
    { required: false },
  );
  const messageValidation = validateMessageBody(getFormString(formData, "body"), {
    required: true,
  });

  if (subjectValidation.error) {
    return {
      status: "error",
      message: subjectValidation.error,
    };
  }

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

  revalidatePath("/messages");
  redirect(`/messages/${conversationId}`);
}

export async function sendMessageAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  await requireAuthenticatedUser();
  const conversationId = getFormString(formData, "conversationId").trim();
  const messageValidation = validateMessageBody(getFormString(formData, "body"), {
    required: true,
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
  const { error } = await supabase.rpc("send_private_message", {
    p_conversation_id: conversationId,
    p_body: messageValidation.body,
  });

  if (error) {
    return {
      status: "error",
      message: "Det gick inte att skicka meddelandet. Försök igen.",
    };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  redirect(`/messages/${conversationId}`);
}

export async function acceptMessageRequestAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  await requireAuthenticatedUser();
  const conversationId = getFormString(formData, "conversationId").trim();

  if (!conversationId) {
    return {
      status: "error",
      message: "Förfrågan saknas.",
    };
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

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  return {
    status: "success",
    message: "Meddelandeförfrågan accepterad.",
  };
}

export async function ignoreMessageRequestAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  await requireAuthenticatedUser();
  const conversationId = getFormString(formData, "conversationId").trim();

  if (!conversationId) {
    return {
      status: "error",
      message: "Förfrågan saknas.",
    };
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

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  redirect("/messages?tab=requests");
}

export async function declineMessageRequestAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  await requireAuthenticatedUser();
  const conversationId = getFormString(formData, "conversationId").trim();

  if (!conversationId) {
    return {
      status: "error",
      message: "Förfrågan saknas.",
    };
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

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  redirect("/messages?tab=requests");
}
