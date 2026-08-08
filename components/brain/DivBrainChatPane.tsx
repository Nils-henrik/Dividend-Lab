"use client";

import { useEffect, useMemo, useState } from "react";
import type { DivBrainActionState } from "@/lib/divbrain/action-state";
import type { DivBrainShellTranscriptView } from "@/lib/divbrain/server/ui";
import DivBrainComposer from "./DivBrainComposer";
import DivBrainTranscript, {
  type DivBrainOptimisticUserMessage,
} from "./DivBrainTranscript";

type Props = {
  conversationId: string;
  transcript: DivBrainShellTranscriptView;
};

function latestPersistedUserMessage(transcript: DivBrainShellTranscriptView) {
  if (transcript.status !== "ready") {
    return null;
  }

  for (let index = transcript.items.length - 1; index >= 0; index -= 1) {
    const item = transcript.items[index];
    if (item?.kind === "user_message") {
      return item;
    }
  }

  return null;
}

export default function DivBrainChatPane({ conversationId, transcript }: Props) {
  const [optimisticMessage, setOptimisticMessage] =
    useState<DivBrainOptimisticUserMessage | null>(null);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  const optimisticPersisted = useMemo(() => {
    if (!optimisticMessage) {
      return false;
    }

    const latestUserMessage = latestPersistedUserMessage(transcript);
    if (!latestUserMessage || latestUserMessage.content !== optimisticMessage.content) {
      return false;
    }

    const persistedAt = Date.parse(latestUserMessage.createdAt);
    const optimisticAt = Date.parse(optimisticMessage.createdAt);

    return (
      Number.isFinite(persistedAt) &&
      Number.isFinite(optimisticAt) &&
      persistedAt >= optimisticAt - 5_000
    );
  }, [optimisticMessage, transcript]);

  useEffect(() => {
    if (optimisticPersisted) {
      setOptimisticMessage(null);
    }
  }, [optimisticPersisted]);

  function handleOptimisticSubmit(content: string) {
    setOptimisticMessage({
      id: `optimistic-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
    });
    setWaitingForResponse(true);
  }

  function handleSubmissionSettled(state: DivBrainActionState) {
    setWaitingForResponse(false);
    if (!state.persisted) {
      setOptimisticMessage(null);
    }
  }

  return (
    <>
      <DivBrainTranscript
        transcript={transcript}
        optimisticUserMessage={optimisticPersisted ? null : optimisticMessage}
        showThinking={waitingForResponse}
      />
      <DivBrainComposer
        conversationId={conversationId}
        onOptimisticSubmit={handleOptimisticSubmit}
        onSubmissionSettled={handleSubmissionSettled}
      />
    </>
  );
}
