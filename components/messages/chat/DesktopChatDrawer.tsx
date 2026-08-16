"use client";

import { useMemo, useState } from "react";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import AppIcon from "@/components/layout/AppIcon";
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
  open: boolean;
  contacts: ChatContact[];
  chats: ConversationSummary[];
  requests: ConversationSummary[];
  presenceByUserId: Record<string, PresenceView>;
  onClose: () => void;
  onOpenContact: (userId: string) => void;
  onOpenConversation: (conversationId: string) => void;
};

export default function DesktopChatDrawer({
  open,
  contacts,
  chats,
  requests,
  presenceByUserId,
  onClose,
  onOpenContact,
  onOpenConversation,
}: Props) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"chats" | "contacts" | "requests">("chats");
  const filtered = useMemo(
    () => filterChatSearch({ query, chats, contacts }),
    [query, chats, contacts],
  );
  const sortedContacts = useMemo(
    () => sortChatContacts(query ? filtered.contacts : contacts, presenceByUserId),
    [contacts, filtered.contacts, presenceByUserId, query],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden w-[22rem] overflow-hidden rounded-2xl border divlab-border-neutral bg-divlab-card shadow-[var(--divlab-shadow-panel)] lg:block xl:hidden">
      <div className="flex items-center justify-between border-b divlab-border-neutral px-4 py-3">
        <p className="text-sm font-semibold text-divlab-text">Chattar</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng chattpanelen"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-divlab-text-muted transition hover:bg-white/[0.06] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          <AppIcon name="close" />
        </button>
      </div>
      <div className="px-4 py-3">
        <label className="block">
          <span className="sr-only">Sök chattar och kontakter</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök"
            className="w-full divlab-input px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="flex gap-1 px-3 pb-2" role="tablist" aria-label="Chattvyer">
        {(
          [
            ["chats", "Chattar"],
            ["contacts", "Kontakter"],
            ["requests", `Förfrågningar${requests.length ? ` (${requests.length})` : ""}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              tab === id ? "divlab-selected" : "text-divlab-text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="max-h-[24rem] overflow-y-auto pb-3">
        {tab === "contacts" ? (
          <ul>
            {sortedContacts.map((contact) => (
              <li key={contact.userId}>
                <button
                  type="button"
                  onClick={() => onOpenContact(contact.userId)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                >
                  <ProfileAvatar
                    avatarUrl={contact.avatarUrl}
                    initials={contact.initials}
                    sizeClassName="h-9 w-9"
                    textClassName="text-[10px]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-divlab-text">
                      {contact.name}
                    </span>
                    <PresenceIndicator
                      presence={presenceByUserId[contact.userId]}
                      showLabel
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : tab === "requests" ? (
          <ul>
            {requests.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onOpenConversation(conversation.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04]"
                >
                  <ProfileAvatar
                    avatarUrl={conversation.otherParticipant?.avatarUrl ?? null}
                    initials={conversation.otherParticipant?.initials ?? "DL"}
                    sizeClassName="h-9 w-9"
                    textClassName="text-[10px]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-divlab-text">
                      {conversation.otherParticipant?.name ?? DIVLAB_MEMBER_LABEL}
                    </span>
                    <span className="block truncate text-xs text-divlab-text-muted">
                      {conversation.lastMessagePreview}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul>
            {(query ? filtered.chats : chats).map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onOpenConversation(conversation.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04]"
                >
                  <ProfileAvatar
                    avatarUrl={conversation.otherParticipant?.avatarUrl ?? null}
                    initials={conversation.otherParticipant?.initials ?? "DL"}
                    sizeClassName="h-9 w-9"
                    textClassName="text-[10px]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-divlab-text">
                        {conversation.otherParticipant?.name ?? DIVLAB_MEMBER_LABEL}
                      </span>
                      <span className="shrink-0 text-[11px] text-divlab-text-muted">
                        {formatMessageTimestamp(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span
                      className={`block truncate text-xs ${
                        conversation.hasUnread
                          ? "font-medium text-divlab-text"
                          : "text-divlab-text-muted"
                      }`}
                    >
                      {conversation.lastMessagePreview}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}