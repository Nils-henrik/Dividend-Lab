import Link from "next/link";
import { formatDivBrainConversationTimestamp } from "@/lib/divbrain/dates";

export type DivBrainConversationRailItem = {
  id: string;
  title: string;
  updatedAt: string;
  archived: boolean;
};

type Props = {
  conversations: readonly DivBrainConversationRailItem[];
  selectedConversationId: string | null;
  hasMoreConversations: boolean;
};

export default function DivBrainConversationRail({
  conversations,
  selectedConversationId,
  hasMoreConversations,
}: Props) {
  return (
    <nav
      aria-label="Konversationshistorik"
      className="divlab-card flex h-full flex-col"
    >
      <div className="border-b divlab-border-neutral px-4 py-4">
        <p className="divlab-section-label tracking-[0.18em]">Konversationer</p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="divlab-btn-ghost mt-3 flex w-full min-h-10 cursor-not-allowed items-center justify-between opacity-60"
        >
          <span>Ny konversation</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-divlab-text-muted">
            Nästa steg
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-sm leading-6 text-divlab-text-muted">
            Inga konversationer ännu.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => {
              const selected = conversation.id === selectedConversationId;
              const timestamp = formatDivBrainConversationTimestamp(
                conversation.updatedAt,
              );

              return (
                <li key={conversation.id}>
                  <Link
                    href={`/brain?conversation=${encodeURIComponent(conversation.id)}`}
                    aria-current={selected ? "page" : undefined}
                    className={`block rounded-xl px-3 py-2.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-divlab-blue ${
                      selected
                        ? "bg-divlab-elevated text-divlab-text"
                        : "text-divlab-text-secondary hover:bg-divlab-elevated/70 hover:text-divlab-text"
                    }`}
                  >
                    <span className="block truncate text-sm font-medium">
                      {conversation.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-divlab-text-muted">
                      <time
                        className="tabular-nums"
                        dateTime={conversation.updatedAt}
                      >
                        {timestamp}
                      </time>
                      {conversation.archived ? (
                        <span>Arkiverad</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hasMoreConversations ? (
        <p className="border-t divlab-border-neutral px-4 py-3 text-xs leading-5 text-divlab-text-muted">
          Endast de senaste konversationerna visas i den här Alpha-vyn.
        </p>
      ) : null}
    </nav>
  );
}
