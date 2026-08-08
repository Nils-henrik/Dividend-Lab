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
      <div className="flex flex-1 flex-col justify-center gap-6 px-5 py-10 sm:px-8">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl">
            Inga arkiverade konversationer
          </h2>
          <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
            Konversationer som du arkiverar visas här och kan återställas
            senare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-5 py-10 sm:px-8">
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl">
          Fråga DivBrain
        </h2>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Skapa en privat konversation och fråga om börsen, sparande och
          privatekonomi. DivBrain kan använda relevant material från DivLab när
          det finns.
        </p>
      </div>

      <div className="max-w-xs">
        <DivBrainCreateConversationButton />
      </div>

      <ul className="divlab-inset max-w-xl space-y-2 rounded-2xl px-4 py-4 text-sm leading-6 text-divlab-text-secondary">
        <li>AI-svar kan innehålla fel — kontrollera viktig information.</li>
        <li>Inga livekurser eller externa marknadsdata används ännu.</li>
        <li>DivBrain ger utbildande information, inte personlig finansiell rådgivning.</li>
      </ul>
    </div>
  );
}
