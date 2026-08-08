import type { DivBrainArchiveScope } from "@/lib/divbrain/brain-routes";
import DivBrainCreateConversationButton from "./DivBrainCreateConversationButton";

type Props = {
  archiveScope?: DivBrainArchiveScope;
};

export default function DivBrainEmptyState({
  archiveScope = "active",
}: Props) {
  if (archiveScope === "archived") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-10 text-center sm:px-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border divlab-border-neutral bg-divlab-elevated text-divlab-text-muted" aria-hidden="true">
          ◌
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-2xl">
            Inga arkiverade konversationer
          </h2>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Konversationer som du arkiverar visas här och kan återställas senare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-divlab-blue/20 bg-divlab-blue/10 text-xl text-divlab-blue shadow-sm" aria-hidden="true">
        ✦
      </div>
      <div className="mt-4 max-w-lg">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-[1.75rem]">
          Börja en ny konversation
        </h2>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          Fråga DivBrain om börsen, fonder, sparande eller privatekonomi. När relevant DivLab-material finns används det som källa.
        </p>
      </div>

      <div className="mt-5 w-full max-w-xs">
        <DivBrainCreateConversationButton />
      </div>

      <div className="mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-3">
        {[
          "Vad är en indexfond?",
          "Hur fungerar utdelning?",
          "Förklara P/E enkelt",
        ].map((prompt) => (
          <div
            key={prompt}
            className="rounded-xl border divlab-border-neutral bg-divlab-elevated/35 px-3 py-2.5 text-left text-xs leading-5 text-divlab-text-muted"
          >
            {prompt}
          </div>
        ))}
      </div>

      <p className="mt-5 max-w-lg text-[10px] leading-4 text-divlab-text-muted sm:text-[11px]">
        AI-svar kan innehålla fel. Inga livekurser används ännu. DivBrain ger utbildande information, inte personlig finansiell rådgivning.
      </p>
    </div>
  );
}
