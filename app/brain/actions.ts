"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DivBrainActionState } from "@/lib/divbrain/action-state";
import { createDivBrainAlphaAccessModule } from "@/lib/divbrain/server/access";
import {
  runArchiveDivBrainConversation,
  runCreateDivBrainConversation,
  runDeleteDivBrainConversation,
  runRenameDivBrainConversation,
  runRestoreDivBrainConversation,
  runSubmitDivBrainMessage,
  type DivBrainInteractionDeps,
  type DivBrainInteractionResult,
} from "@/lib/divbrain/server/ui/interaction";
import { createDivBrainRuntimeRepository } from "@/lib/divbrain/server/ui/runtime";

function createProductionInteractionDeps(): DivBrainInteractionDeps {
  const access = createDivBrainAlphaAccessModule();
  return {
    actorResolver: access.actorResolver,
    accessGate: access.accessGate,
    createRepository: () => createDivBrainRuntimeRepository(),
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
