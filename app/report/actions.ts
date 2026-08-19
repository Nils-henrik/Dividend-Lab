"use server";

import { submitContentReport } from "@/lib/moderation/reporting.server";
import type { ContentReportActionState } from "@/lib/moderation/types";

export async function submitContentReportAction(
  _state: ContentReportActionState,
  formData: FormData,
): Promise<ContentReportActionState> {
  return submitContentReport(formData);
}
