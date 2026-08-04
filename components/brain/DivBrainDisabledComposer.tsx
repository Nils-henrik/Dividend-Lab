import { restoreDivBrainConversationAction } from "@/app/brain/actions";

type Props = {
  conversationId: string;
  archived?: boolean;
};

export default function DivBrainDisabledComposer({
  conversationId,
  archived = false,
}: Props) {
  if (!archived) {
    return null;
  }

  return (
    <div className="border-t divlab-border-neutral px-4 py-4 sm:px-5">
      <div className="space-y-3">
        <p className="text-sm leading-6 text-divlab-text-secondary">
          Arkiverade konversationer är skrivskyddade. Återställ konversationen
          för att spara nya frågor.
        </p>
        <form action={restoreDivBrainConversationAction}>
          <input type="hidden" name="conversationId" value={conversationId} />
          <button type="submit" className="divlab-btn-primary min-h-10 px-4">
            Återställ konversation
          </button>
        </form>
      </div>
    </div>
  );
}
