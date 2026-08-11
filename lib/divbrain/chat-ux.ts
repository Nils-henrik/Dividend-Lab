import { DIVBRAIN_ATTACHMENT_COPY_SV } from "./attachments";

export type DivBrainComposerKeyIntent = {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  canSubmit: boolean;
};

export type DivBrainComposerDiscardServerResult =
  | { ok: true }
  | { ok: false; safeMessage: string };

export type DivBrainComposerDiscardOutcome =
  | { remove: true }
  | { remove: false; safeMessage: string };

/**
 * Pure discard UX boundary for composer chips.
 * Server-backed chips are removed only after a successful discard.
 */
export function resolveDivBrainComposerDiscardOutcome(params: {
  hasServerAttachmentId: boolean;
  discardResult: DivBrainComposerDiscardServerResult | null;
}): DivBrainComposerDiscardOutcome {
  if (!params.hasServerAttachmentId) {
    return { remove: true };
  }

  if (params.discardResult?.ok === true) {
    return { remove: true };
  }

  const safeMessage =
    params.discardResult && !params.discardResult.ok
      ? params.discardResult.safeMessage.trim()
      : "";

  return {
    remove: false,
    safeMessage:
      safeMessage.length > 0
        ? safeMessage
        : DIVBRAIN_ATTACHMENT_COPY_SV.discardFailure,
  };
}

export function shouldSubmitDivBrainComposerKey(
  intent: DivBrainComposerKeyIntent,
): boolean {
  return (
    intent.key === "Enter" &&
    !intent.shiftKey &&
    !intent.isComposing &&
    intent.canSubmit
  );
}

export type DivBrainOptimisticPersistenceInput = {
  optimistic: {
    content: string;
    createdAt: string;
    previousPersistedUserMessageId: string | null;
  };
  latestPersisted: {
    id: string;
    content: string;
    createdAt: string;
  } | null;
};

export function isDivBrainOptimisticMessagePersisted({
  optimistic,
  latestPersisted,
}: DivBrainOptimisticPersistenceInput): boolean {
  if (
    !latestPersisted ||
    latestPersisted.id === optimistic.previousPersistedUserMessageId ||
    latestPersisted.content !== optimistic.content
  ) {
    return false;
  }

  const persistedAt = Date.parse(latestPersisted.createdAt);
  const optimisticAt = Date.parse(optimistic.createdAt);

  return (
    Number.isFinite(persistedAt) &&
    Number.isFinite(optimisticAt) &&
    persistedAt >= optimisticAt - 5_000
  );
}
