"use client";

import { useMemo } from "react";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { filterChatSearch, sortChatContacts } from "@/lib/messages/chat-state";
import { formatMessageTimestamp } from "@/lib/messages/format";
import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type {
  ChatContact,
  ConversationSummary,
  PresenceView,
} from "@/lib/messages/types";
import PresenceIndicator from "./PresenceIndicator";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  contacts: ChatContact[];
  chats: ConversationSummary[];
  requests: ConversationSummary[];
  presenceByUserId: Record<string, PresenceView>;
  onOpenContact: (userId: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onShowRequests: () => void;
  showingRequests: boolean;
};

export default function MobileChatInbox({
  query,
  onQueryChange,
  contacts,
  chats,
  requests,
  presenceByUserId,
  onOpenContact,
  onOpenConversation,
  onShowRequests,
  showingRequests,
}: Props) {
  const filtered = useMemo(
    () => filterChatSearch({ query, chats, contacts }),
    [query, chats, contacts],
  );
  const activeContacts = useMemo(
    () =>
      sortChatContacts(contacts, presenceByUserId).filter(
        (contact) => presenceByUserId[contact.userId]?.kind === "online",
      ),
    [contacts, presenceByUserId],
  );
  const visibleChats = query ? filtered.chats : chats;
  const visibleContacts = query ? filtered.contacts : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pb-3">
        <label className="block">
          <span className="sr-only">Sök chattar och kontakter</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Sök"
            className="w-full divlab-input px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      {activeContacts.length > 0 && !showingRequests ? (
        <section className="border-b divlab-border-neutral px-4 pb-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Aktiva nu
          </p>
          <div className="flex gap-3 overflow-x-auto">
            {activeContacts.map((contact) => (
              <button
                key={contact.userId}
                type="button"
                onClick={() => onOpenContact(contact.userId)}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                <span className="relative">
                  <ProfileAvatar
                    avatarUrl={contact.avatarUrl}
                    initials={contact.initials}
                    sizeClassName="h-12 w-12"
                    textClassName="text-xs"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-divlab-card bg-divlab-green"
                  />
                </span>
                <span className="w-full truncate text-[11px] text-divlab-text">
                  {contact.name}
                </span>
                <span className="sr-only">Aktiv nu</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onShowRequests}
          className="text-sm text-divlab-blue-muted transition hover:text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          {showingRequests ? "Tillbaka till chattar" : "Meddelandeförfrågningar"}
          {!showingRequests && requests.length > 0 ? ` (${requests.length})` : ""}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showingRequests ? (
          requests.length === 0 ? (
            <p className="px-4 py-6 text-sm text-divlab-text-secondary">
              Inga meddelandeförfrågningar.
            </p>
          ) : (
            requests.map((conversation) => (
              <InboxRow
                key={conversation.id}
                name={conversation.otherParticipant?.name ?? DIVLAB_MEMBER_LABEL}
                preview={conversation.lastMessagePreview}
                timestamp={conversation.lastMessageAt}
                avatarUrl={conversation.otherParticipant?.avatarUrl ?? null}
                initials={conversation.otherParticipant?.initials ?? "DL"}
                hasUnread={conversation.hasUnread}
                presence={
                  conversation.otherParticipant
                    ? presenceByUserId[conversation.otherParticipant.id]
                    : undefined
                }
                onClick={() => onOpenConversation(conversation.id)}
              />
            ))
          )
        ) : (
          <>
            {visibleChats.map((conversation) => (
              <InboxRow
                key={conversation.id}
                name={conversation.otherParticipant?.name ?? DIVLAB_MEMBER_LABEL}
                preview={conversation.lastMessagePreview}
                timestamp={conversation.lastMessageAt}
                avatarUrl={conversation.otherParticipant?.avatarUrl ?? null}
                initials={conversation.otherParticipant?.initials ?? "DL"}
                hasUnread={conversation.hasUnread}
                presence={
                  conversation.otherParticipant
                    ? presenceByUserId[conversation.otherParticipant.id]
                    : undefined
                }
                onClick={() => onOpenConversation(conversation.id)}
              />
            ))}
            {visibleContacts.map((contact) => (
              <InboxRow
                key={contact.userId}
                name={contact.name}
                preview="Starta konversation"
                timestamp={null}
                avatarUrl={contact.avatarUrl}
                initials={contact.initials}
                hasUnread={false}
                presence={presenceByUserId[contact.userId]}
                onClick={() => onOpenContact(contact.userId)}
              />
            ))}
            {visibleChats.length === 0 && visibleContacts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-divlab-text-secondary">
                Inga chattar ännu.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function InboxRow({
  name,
  preview,
  timestamp,
  avatarUrl,
  initials,
  hasUnread,
  presence,
  onClick,
}: {
  name: string;
  preview: string;
  timestamp: string | null;
  avatarUrl: string | null;
  initials: string;
  hasUnread: boolean;
  presence?: PresenceView;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${
        hasUnread ? "bg-divlab-blue/[0.05]" : ""
      }`}
    >
      <span className="relative">
        <ProfileAvatar
          avatarUrl={avatarUrl}
          initials={initials}
          sizeClassName="h-12 w-12"
          textClassName="text-sm"
        />
        {presence?.kind === "online" ? (
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-divlab-card bg-divlab-green"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-divlab-text">
            {name}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-divlab-text-muted">
            {formatMessageTimestamp(timestamp)}
          </span>
        </span>
        <span
          className={`mt-0.5 block truncate text-sm ${
            hasUnread ? "text-divlab-text" : "text-divlab-text-muted"
          }`}
        >
          {preview}
        </span>
        <PresenceIndicator presence={presence} />
      </span>
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-divlab-blue"
        />
      ) : (
        <span className="sr-only">{hasUnread ? "Oläst konversation" : ""}</span>
      )}
      {hasUnread ? <span className="sr-only">Oläst konversation</span> : null}
    </button>
  );
}