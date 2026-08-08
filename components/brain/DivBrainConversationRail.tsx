import Link from "next/link";
import {
  buildDivBrainHref,
  type DivBrainArchiveScope,
} from "@/lib/divbrain/brain-routes";
import { formatDivBrainConversationTimestamp } from "@/lib/divbrain/dates";
import DivBrainCreateConversationButton from "./DivBrainCreateConversationButton";
import scrollStyles from "./DivBrainScrollArea.module.css";
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
      className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border divlab-border-neutral bg-divlab-surface/75 shadow-sm"
    >
      <div className="px-3.5 pb-3 pt-4">
        <div className="flex items-center justify-between px-1">
          <p className="divlab-section-label tracking-[0.18em]">Konversationer</p>
          <span className="text-[10px] tabular-nums text-divlab-text-muted">
            {conversations.length}
          </span>
        </div>
        <DivBrainCreateConversationButton className="mt-3" />
        <DivBrainScopeSwitch archiveScope={archiveScope} />
      </div>

      <div className="mx-3 border-t divlab-border-neutral" />

      <div
        className={`${scrollStyles.scrollArea} min-h-0 flex-1 overflow-y-auto px-2 py-2.5`}
      >
        {conversations.length === 0 ? (
          <p className="px-3 py-5 text-sm leading-6 text-divlab-text-muted">
            {archiveScope === "archived"
              ? "Inga arkiverade konversationer."
              : "Inga konversationer ännu."}
          </p>
        ) : (
          <ul className="space-y-1.5">
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
                    className={`group block rounded-xl border px-3 py-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-divlab-blue ${
                      selected
                        ? "border-divlab-blue/20 bg-divlab-blue/10 text-divlab-text shadow-sm"
                        : "border-transparent text-divlab-text-secondary hover:border-divlab-border hover:bg-divlab-elevated/55 hover:text-divlab-text"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full transition ${
                          selected ? "bg-divlab-blue" : "bg-divlab-border"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="block min-w-0 flex-1 truncate text-sm font-medium">
                        {conversation.title}
                      </span>
                    </span>
                    <span className="mt-1.5 block pl-3.5 text-[11px] text-divlab-text-muted">
                      <time className="tabular-nums" dateTime={conversation.updatedAt}>
                        {timestamp}
                      </time>
                      {conversation.archived ? <span> · Arkiverad</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hasMoreConversations ? (
        <p className="border-t divlab-border-neutral px-4 py-3 text-[11px] leading-5 text-divlab-text-muted">
          De senaste konversationerna visas här.
        </p>
      ) : null}
    </nav>
  );
}
