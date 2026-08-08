export type DivBrainComposerKeyIntent = {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  canSubmit: boolean;
};

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
