import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import type { ConversationSummary } from "@/lib/messages/types";

type Props = {
  conversations: ConversationSummary[];
};

function formatActivityTime(value: string | null) {
  if (!value) {
    return "Ingen aktivitet än";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tid saknas";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MessagesInbox({ conversations }: Props) {
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

      {conversations.length === 0 ? (
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
                className="flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.03] md:flex-row md:items-center md:justify-between"
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {conversation.hasUnread && (
                        <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                      )}
                      <p className="truncate text-sm font-semibold text-white">
                        {conversation.otherParticipant?.name ?? "Dividend Lab-medlem"}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-400">
                      {conversation.lastMessagePreview}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-xs text-gray-500 md:text-right">
                  {formatActivityTime(conversation.lastMessageAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
