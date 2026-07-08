import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { formatMessageTimestamp } from "@/lib/messages/format";
import type { ConversationThread } from "@/lib/messages/types";
import MessageComposer from "./MessageComposer";

type Props = {
  conversation: ConversationThread;
  currentUserId: string;
};

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
          <div className="space-y-3">
            {conversation.messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              const senderLabel = isOwnMessage
                ? "Du"
                : (otherParticipant?.name ?? "Dividend Lab-medlem");

              return (
                <article
                  key={message.id}
                  className={`w-full rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 ${
                    isOwnMessage
                      ? "border-[#D4AF37]/20 bg-[#D4AF37]/[0.055]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOwnMessage ? "bg-[#D4AF37]" : "bg-white/30"
                        }`}
                      />
                      <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                        {senderLabel}
                      </p>
                    </div>
                    <p
                      className={`text-xs tabular-nums ${
                        isOwnMessage ? "text-[#F9D976]/70" : "text-gray-500"
                      }`}
                    >
                      {formatMessageTimestamp(message.createdAt)}
                    </p>
                  </div>

                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-200">
                    {message.body}
                  </p>
                </article>
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
