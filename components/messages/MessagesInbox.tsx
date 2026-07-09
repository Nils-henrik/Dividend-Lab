import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { formatMessageTimestamp } from "@/lib/messages/format";
import type { ConversationSummary } from "@/lib/messages/types";

type Props = {
  conversations: ConversationSummary[];
  errorMessage?: string;
};

export default function MessagesInbox({ conversations, errorMessage }: Props) {
  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-divlab-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-divlab-gold/30 to-transparent" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-divlab-gold">
              Meddelanden
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
              Inkorg
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-divlab-text-secondary">
              Privata konversationer mellan Dividend Lab-medlemmar. Håll
              tonen tydlig, respektfull och långsiktig.
            </p>
          </div>

          <Link href="/messages/new" className="divlab-btn-primary w-fit px-5 py-2.5">
            Nytt meddelande
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <section className="divlab-card p-8">
          <p className="text-lg font-semibold text-divlab-text">
            Inkorgen kunde inte laddas
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            {errorMessage}
          </p>
          <Link href="/messages" className="divlab-btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm">
            Försök igen
          </Link>
        </section>
      ) : conversations.length === 0 ? (
        <section className="divlab-card p-8">
          <p className="text-lg font-semibold text-divlab-text">Inga meddelanden än</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            Starta en konversation från en användares profil eller forumet. I
            denna MVP kan du även börja med ett användarnamn.
          </p>
          <Link href="/messages/new" className="divlab-btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm">
            Starta konversation
          </Link>
        </section>
      ) : (
        <section className="divlab-card overflow-hidden p-0">
          <div className="border-b divlab-border-neutral px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-divlab-text-muted">
              Senaste konversationer
            </p>
          </div>
          <div className="divide-y divide-white/[0.08]">
            {conversations.map((conversation) => {
              const subject =
                conversation.subject?.trim() ||
                conversation.lastMessagePreview ||
                "Ingen ämnesrad";

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className={`grid gap-4 px-5 py-5 divlab-row-hover md:grid-cols-[minmax(0,1fr)_auto] md:items-start ${
                    conversation.hasUnread ? "bg-divlab-gold/[0.04]" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-4">
                    {conversation.otherParticipant ? (
                      <ProfileAvatar
                        avatarUrl={conversation.otherParticipant.avatarUrl}
                        initials={conversation.otherParticipant.initials}
                        sizeClassName="h-12 w-12"
                        textClassName="text-sm"
                      />
                    ) : (
                      <ProfileAvatar
                        avatarUrl={null}
                        initials="DL"
                        sizeClassName="h-12 w-12"
                        textClassName="text-sm"
                      />
                    )}
                    <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          {conversation.hasUnread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#D4AF37]" />
                          )}
                          <span className="truncate text-sm font-semibold text-white">
                            {conversation.otherParticipant?.name ??
                              "Dividend Lab-medlem"}
                          </span>
                        </div>
                        {conversation.otherParticipant?.username && (
                          <p className="mt-1 truncate text-xs text-gray-500">
                            @{conversation.otherParticipant.username}
                          </p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm ${
                            conversation.hasUnread
                              ? "font-semibold text-white"
                              : "font-medium text-gray-200"
                          }`}
                        >
                          {subject}
                        </p>
                        <p
                          className={`mt-1 truncate text-sm ${
                            conversation.hasUnread ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {conversation.lastMessagePreview}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pl-16 md:justify-end md:pl-0">
                    <p
                      className={`shrink-0 text-xs tabular-nums ${
                        conversation.hasUnread ? "text-[#D4AF37]" : "text-gray-500"
                      }`}
                    >
                      {formatMessageTimestamp(conversation.lastMessageAt)}
                    </p>
                    {conversation.hasUnread && (
                      <span className="h-2 w-2 rounded-full bg-[#D4AF37] md:hidden" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
