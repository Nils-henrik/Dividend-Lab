"use server";

import { decideModerationReport } from "@/lib/moderation/moderation.server";
import type { ModerationDecisionActionState } from "@/lib/moderation/types";

export async function decideModerationReportAction(
  _state: ModerationDecisionActionState,
  formData: FormData,
): Promise<ModerationDecisionActionState> {
  return decideModerationReport(formData);
}
