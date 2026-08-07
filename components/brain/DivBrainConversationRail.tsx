import Link from "next/link";
import {
  buildDivBrainHref,
  type DivBrainArchiveScope,
} from "@/lib/divbrain/brain-routes";
import { formatDivBrainConversationTimestamp } from "@/lib/divbrain/dates";
import DivBrainCreateConversationButton from "./DivBrainCreateConversationButton";
import DivBrainScopeSwitch from "./DivBrainScopeSwitch";

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
  archiveScope: DivBrainArchiveScope;
};

export default function DivBrainConversationRail({
  conversations,
  selectedConversationId,
  hasMoreConversations,
  archiveScope,
}: Props) {
  return (
    <nav
      aria-label="Konversationshistorik"
      className="divlab-card flex h-full flex-col"
    >
      <div className="border-b divlab-border-neutral px-4 py-4">
        <p className="divlab-section-label tracking-[0.18em]">Konversationer</p>
        <DivBrainCreateConversationButton className="mt-3" />
        <DivBrainScopeSwitch archiveScope={archiveScope} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-sm leading-6 text-divlab-text-muted">
            {archiveScope === "archived"
              ? "Inga arkiverade konversationer."
              : "Inga konversationer ännu."}
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
                    href={buildDivBrainHref({
                      archiveScope,
                      conversationId: conversation.id,
                    })}
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
                      {conversation.archived ? <span>Arkiverad</span> : null}
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
