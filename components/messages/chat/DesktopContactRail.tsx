"use client";

import ProfileAvatar from "@/components/account/ProfileAvatar";
import { sortChatContacts } from "@/lib/messages/chat-state";
import type { ChatContact, PresenceView } from "@/lib/messages/types";
import PresenceIndicator from "./PresenceIndicator";

type Props = {
  contacts: ChatContact[];
  presenceByUserId: Record<string, PresenceView>;
  onOpenContact: (userId: string) => void;
};

export default function DesktopContactRail({
  contacts,
  presenceByUserId,
  onOpenContact,
}: Props) {
  const sorted = sortChatContacts(contacts, presenceByUserId);

  return (
    <aside
      aria-label="Kontakter"
      className="fixed bottom-0 right-0 top-20 z-20 hidden w-72 border-l divlab-border-neutral bg-divlab-shell xl:flex xl:flex-col"
    >
      <div className="border-b divlab-border-neutral px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
          Kontakter
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {sorted.length === 0 ? (
          <p className="px-4 py-6 text-sm leading-6 text-divlab-text-secondary">
            Inga accepterade kontakter ännu.
          </p>
        ) : (
          <ul className="space-y-0.5 px-2">
            {sorted.map((contact) => {
              const presence = presenceByUserId[contact.userId];

              return (
                <li key={contact.userId}>
                  <button
                    type="button"
                    onClick={() => onOpenContact(contact.userId)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                  >
                    <span className="relative">
                      <ProfileAvatar
                        avatarUrl={contact.avatarUrl}
                        initials={contact.initials}
                        sizeClassName="h-9 w-9"
                        textClassName="text-[10px]"
                      />
                      {presence?.kind === "online" ? (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-divlab-shell bg-divlab-green"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-divlab-text">
                          {contact.name}
                        </span>
                        {contact.hasUnread ? (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-divlab-blue"
                          />
                        ) : null}
                      </span>
                      <PresenceIndicator presence={presence} showLabel />
                    </span>
                    {contact.hasUnread ? (
                      <span className="sr-only">Oläst konversation</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}