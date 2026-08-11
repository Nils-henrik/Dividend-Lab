"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DivBrainActionState } from "@/lib/divbrain/action-state";
import { createDivBrainAlphaAccessModule } from "@/lib/divbrain/server/access";
import {
  runArchiveDivBrainConversation,
  runConfirmDivBrainAttachmentUpload,
  runCreateDivBrainConversation,
  runDeleteDivBrainConversation,
  runDiscardDivBrainUnlinkedAttachment,
  runPrepareDivBrainAttachmentUpload,
  runRenameDivBrainConversation,
  runRestoreDivBrainConversation,
  runSubmitDivBrainMessage,
  type DivBrainConfirmAttachmentUploadResult,
  type DivBrainDiscardUnlinkedAttachmentResult,
  type DivBrainInteractionDeps,
  type DivBrainInteractionResult,
  type DivBrainPrepareAttachmentUploadResult,
} from "@/lib/divbrain/server/ui/interaction";
import { createDivBrainRuntimeRepository } from "@/lib/divbrain/server/ui/runtime";
import { createDivBrainServiceRoleAttachmentRepository } from "@/lib/divbrain/server/attachments";

function createProductionInteractionDeps(): DivBrainInteractionDeps {
  const access = createDivBrainAlphaAccessModule();
  return {
    actorResolver: access.actorResolver,
    accessGate: access.accessGate,
    createRepository: () => createDivBrainRuntimeRepository(),
    createAttachmentRepository: () =>
      createDivBrainServiceRoleAttachmentRepository(),
  };
}

function applyInteractionResult(
  result: DivBrainInteractionResult,
): DivBrainActionState {
  if (result.kind === "redirect") {
    revalidatePath("/brain");
    redirect(result.href);
  }

  revalidatePath("/brain");
  return result.state;
}

export async function createDivBrainConversationAction(): Promise<void> {
  const result = await runCreateDivBrainConversation(
    createProductionInteractionDeps(),
  );
  applyInteractionResult(result);
}

export async function renameDivBrainConversationAction(
  _prev: DivBrainActionState,
  formData: FormData,
): Promise<DivBrainActionState> {
  const result = await runRenameDivBrainConversation(
    createProductionInteractionDeps(),
    formData,
  );
  if (result.kind === "redirect") {
    revalidatePath("/brain");
    redirect(result.href);
  }
  return result.state;
}

export async function archiveDivBrainConversationAction(
  formData: FormData,
): Promise<void> {
  const result = await runArchiveDivBrainConversation(
    createProductionInteractionDeps(),
    formData,
  );
  applyInteractionResult(result);
}

export async function restoreDivBrainConversationAction(
  formData: FormData,
): Promise<void> {
  const result = await runRestoreDivBrainConversation(
    createProductionInteractionDeps(),
    formData,
  );
  applyInteractionResult(result);
}

export async function deleteDivBrainConversationAction(
  formData: FormData,
): Promise<void> {
  const result = await runDeleteDivBrainConversation(
    createProductionInteractionDeps(),
    formData,
  );
  applyInteractionResult(result);
}

export async function submitDivBrainMessageAction(
  _prev: DivBrainActionState,
  formData: FormData,
): Promise<DivBrainActionState> {
  const result = await runSubmitDivBrainMessage(
    createProductionInteractionDeps(),
    formData,
  );
  if (result.kind === "redirect") {
    revalidatePath("/brain");
    redirect(result.href);
  }

  if (result.state.persisted || result.state.status === "blocked") {
    revalidatePath("/brain");
  }

  return result.state;
}

export async function prepareDivBrainAttachmentUploadAction(input: {
  conversationId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
}): Promise<DivBrainPrepareAttachmentUploadResult> {
  return runPrepareDivBrainAttachmentUpload(
    createProductionInteractionDeps(),
    input,
  );
}

export async function confirmDivBrainAttachmentUploadAction(input: {
  attachmentId: string;
}): Promise<DivBrainConfirmAttachmentUploadResult> {
  return runConfirmDivBrainAttachmentUpload(
    createProductionInteractionDeps(),
    input,
  );
}

export async function discardDivBrainUnlinkedAttachmentAction(input: {
  attachmentId: string;
}): Promise<DivBrainDiscardUnlinkedAttachmentResult> {
  return runDiscardDivBrainUnlinkedAttachment(
    createProductionInteractionDeps(),
    input,
  );
}
