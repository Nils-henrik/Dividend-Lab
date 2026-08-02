"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { ContactActionState } from "@/lib/contacts/types";
import { createClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function revalidateContactSurfaces(profileUsername?: string | null) {
  revalidatePath("/contacts");
  revalidatePath("/messages");

  if (profileUsername) {
    revalidatePath(`/profile/${profileUsername}`);
  }
}

async function resolveProfileUsername(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle<{ username: string | null }>();

  return data?.username ?? null;
}

export async function sendContactRequestAction(
  _state: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  await requireAuthenticatedUser();
  const targetUserId = getFormString(formData, "targetUserId").trim();

  if (!targetUserId) {
    return {
      status: "error",
      message: "Användaren kunde inte hittas.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_contact_request", {
    p_target_user_id: targetUserId,
  });

  if (error) {
    return {
      status: "error",
      message: "Kontaktförfrågan kunde inte skickas. Försök igen.",
    };
  }

  const username = await resolveProfileUsername(targetUserId);
  revalidateContactSurfaces(username);

  return {
    status: "success",
    message: "Kontaktförfrågan skickad.",
  };
}

export async function acceptContactRequestAction(
  _state: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  await requireAuthenticatedUser();
  const connectionId = getFormString(formData, "connectionId").trim();

  if (!connectionId) {
    return {
      status: "error",
      message: "Förfrågan saknas.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_contact_request", {
    p_connection_id: connectionId,
  });

  if (error) {
    return {
      status: "error",
      message: "Kontaktförfrågan kunde inte accepteras. Försök igen.",
    };
  }

  revalidateContactSurfaces();
  revalidatePath("/messages");

  return {
    status: "success",
    message: "Kontaktförfrågan accepterad.",
  };
}

export async function declineContactRequestAction(
  _state: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  await requireAuthenticatedUser();
  const connectionId = getFormString(formData, "connectionId").trim();

  if (!connectionId) {
    return {
      status: "error",
      message: "Förfrågan saknas.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_contact_request", {
    p_connection_id: connectionId,
  });

  if (error) {
    return {
      status: "error",
      message: "Kontaktförfrågan kunde inte nekas. Försök igen.",
    };
  }

  revalidateContactSurfaces();

  return {
    status: "success",
    message: "Kontaktförfrågan nekad.",
  };
}

export async function cancelContactRequestAction(
  _state: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  await requireAuthenticatedUser();
  const connectionId = getFormString(formData, "connectionId").trim();

  if (!connectionId) {
    return {
      status: "error",
      message: "Förfrågan saknas.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_contact_request", {
    p_connection_id: connectionId,
  });

  if (error) {
    return {
      status: "error",
      message: "Förfrågan kunde inte avbrytas. Försök igen.",
    };
  }

  revalidateContactSurfaces();

  return {
    status: "success",
    message: "Förfrågan har avbrutits.",
  };
}

export async function removeContactAction(
  _state: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  await requireAuthenticatedUser();
  const connectionId = getFormString(formData, "connectionId").trim();

  if (!connectionId) {
    return {
      status: "error",
      message: "Kontakten saknas.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_contact", {
    p_connection_id: connectionId,
  });

  if (error) {
    return {
      status: "error",
      message: "Kontakten kunde inte tas bort. Försök igen.",
    };
  }

  revalidateContactSurfaces();

  return {
    status: "success",
    message: "Kontakten har tagits bort.",
  };
}
