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
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
              Meddelanden
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
              Inkorg
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
              Privata konversationer mellan Dividend Lab-medlemmar. Håll
              tonen tydlig, respektfull och långsiktig.
            </p>
          </div>

          <Link
            href="/messages/new"
            className="w-fit rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.16)] transition hover:bg-[#F9D976]"
          >
            Nytt meddelande
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-3xl border border-white/10 bg-[#161616] p-8">
          <p className="text-lg font-semibold text-white">
            Inkorgen kunde inte laddas
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            {errorMessage}
          </p>
          <Link
            href="/messages"
            className="mt-6 inline-flex rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Försök igen
          </Link>
        </section>
      ) : conversations.length === 0 ? (
        <section className="rounded-3xl border border-white/10 bg-[#161616] p-8">
          <p className="text-lg font-semibold text-white">Inga meddelanden än</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            Starta en konversation från en användares profil eller forumet. I
            denna MVP kan du även börja med ett användarnamn.
          </p>
          <Link
            href="/messages/new"
            className="mt-6 inline-flex rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Starta konversation
          </Link>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#161616]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
              Senaste konversationer
            </p>
          </div>
          <div className="divide-y divide-white/10">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className={`grid gap-4 px-5 py-5 transition hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${
                  conversation.hasUnread ? "bg-[#D4AF37]/[0.035]" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
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
                  <div className="grid min-w-0 flex-1 gap-1 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
                    <div className="min-w-0">
                      {conversation.hasUnread && (
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D4AF37]" />
                      )}
                      <span className="truncate text-sm font-semibold text-white">
                        {conversation.otherParticipant?.name ?? "Dividend Lab-medlem"}
                      </span>
                      {conversation.otherParticipant?.username && (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          @{conversation.otherParticipant.username}
                        </p>
                      )}
                    </div>
                    <p
                      className={`truncate text-sm ${
                        conversation.hasUnread ? "text-gray-200" : "text-gray-400"
                      }`}
                    >
                      {conversation.lastMessagePreview}
                    </p>
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
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
