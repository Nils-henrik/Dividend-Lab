"use server";

import { submitModerationAppeal } from "@/lib/moderation/appeals.server";
import type { ModerationAppealActionState } from "@/lib/moderation/types";

export async function submitModerationAppealAction(
  actionId: string,
  _state: ModerationAppealActionState,
  formData: FormData,
): Promise<ModerationAppealActionState> {
  return submitModerationAppeal(actionId, formData);
}
