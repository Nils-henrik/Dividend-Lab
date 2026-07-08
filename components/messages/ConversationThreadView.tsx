import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import type { ConversationThread } from "@/lib/messages/types";
import MessageComposer from "./MessageComposer";

type Props = {
  conversation: ConversationThread;
  currentUserId: string;
};

function formatMessageTime(value: string) {
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

export default function ConversationThreadView({
  conversation,
  currentUserId,
}: Props) {
  const otherParticipant = conversation.otherParticipant;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <ProfileAvatar
              avatarUrl={otherParticipant?.avatarUrl ?? null}
              initials={otherParticipant?.initials ?? "DL"}
              sizeClassName="h-14 w-14"
              textClassName="text-base"
            />
            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
                Privat konversation
              </p>
              <h2 className="truncate text-3xl font-semibold tracking-[-0.04em] text-white">
                {otherParticipant?.name ?? "Dividend Lab-medlem"}
              </h2>
              <p className="mt-1 truncate text-sm text-gray-500">
                {otherParticipant?.username
                  ? `@${otherParticipant.username}`
                  : "Profil utan användarnamn"}
              </p>
            </div>
          </div>

          <Link
            href="/messages"
            className="w-fit rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            Till inkorgen
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#161616] p-4 sm:p-6">
        {conversation.messages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm leading-6 text-gray-400">
              Inga meddelanden än. Skriv ett lugnt och tydligt första
              meddelande.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <article
                    className={`max-w-2xl rounded-2xl border px-4 py-3 ${
                      isOwnMessage
                        ? "border-[#D4AF37]/25 bg-[#D4AF37]/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-200">
                      {message.body}
                    </p>
                    <p
                      className={`mt-3 text-[11px] ${
                        isOwnMessage ? "text-[#F9D976]/70" : "text-gray-500"
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#161616] p-5">
        <MessageComposer conversationId={conversation.id} />
      </section>
    </div>
  );
}
