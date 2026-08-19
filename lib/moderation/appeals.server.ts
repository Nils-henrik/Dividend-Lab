import "server-only";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createModerationAdminClient } from "./admin";
import { MODERATION_APPEAL_MAX_LENGTH } from "./config";
import type {
  ModerationAppealActionState,
  ModerationAppealRecord,
  ModerationActionRecord,
} from "./types";

export async function getAppealableModerationAction(actionId: string) {
  const user = await requireAuthenticatedUser();
  const admin = createModerationAdminClient();
  if (!admin) return { user, action: null, appeal: null };

  const { data: actionData, error: actionError } = await admin
    .from("moderation_actions")
    .select("*")
    .eq("id", actionId)
    .maybeSingle();

  if (actionError || !actionData) {
    return { user, action: null, appeal: null };
  }

  const action = actionData as ModerationActionRecord;
  if (action.affected_user_id !== user.id || action.action_type === "no_action") {
    return { user, action: null, appeal: null };
  }

  const { data: appealData } = await admin
    .from("moderation_appeals")
    .select("*")
    .eq("moderation_action_id", action.id)
    .eq("appellant_user_id", user.id)
    .maybeSingle();

  return {
    user,
    action,
    appeal: (appealData as ModerationAppealRecord | null) ?? null,
  };
}

export async function submitModerationAppeal(
  actionId: string,
  formData: FormData,
): Promise<ModerationAppealActionState> {
  const user = await requireAuthenticatedUser();
  const statementValue = formData.get("statement");
  const statement = typeof statementValue === "string" ? statementValue.trim() : "";

  if (statement.length < 20 || statement.length > MODERATION_APPEAL_MAX_LENGTH) {
    return {
      status: "error",
      message: `Beskriv varför beslutet bör omprövas med 20–${MODERATION_APPEAL_MAX_LENGTH} tecken.`,
    };
  }

  const admin = createModerationAdminClient();
  if (!admin) {
    return { status: "error", message: "Omprövningstjänsten är tillfälligt otillgänglig." };
  }

  const { data: actionData, error: actionError } = await admin
    .from("moderation_actions")
    .select("id,affected_user_id,action_type")
    .eq("id", actionId)
    .maybeSingle();

  if (actionError || !actionData || actionData.affected_user_id !== user.id || actionData.action_type === "no_action") {
    return { status: "error", message: "Det här modereringsbeslutet kan inte omprövas från ditt konto." };
  }

  const { error } = await admin.from("moderation_appeals").insert({
    moderation_action_id: actionId,
    appellant_user_id: user.id,
    statement,
  });

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Du har redan begärt omprövning av det här beslutet." };
    }

    console.error("[moderation] appeal insert failed", {
      code: error.code,
      message: error.message,
    });
    return { status: "error", message: "Begäran om omprövning kunde inte registreras." };
  }

  return {
    status: "success",
    message: "Din begäran om omprövning är registrerad och har lagts i moderationskön.",
  };
}
