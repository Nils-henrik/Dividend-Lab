import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { formatMessageTimestamp } from "@/lib/messages/format";
import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type { ConversationSummary } from "@/lib/messages/types";

type Tab = "chats" | "requests";

type Props = {
  chats: ConversationSummary[];
  requests: ConversationSummary[];
  activeTab: Tab;
  errorMessage?: string;
};

function ConversationRows({
  conversations,
  emptyTitle,
  emptyDescription,
}: {
  conversations: ConversationSummary[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (conversations.length === 0) {
    return (
      <section className="divlab-card p-8">
        <p className="text-lg font-semibold text-divlab-text">{emptyTitle}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
          {emptyDescription}
        </p>
        <Link href="/messages/new" className="divlab-btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm">
          Starta konversation
        </Link>
      </section>
    );
  }

  return (
    <section className="divlab-card overflow-hidden p-0">
      <div className="divide-y divide-white/[0.08]">
        {conversations.map((conversation) => {
          const subject =
            conversation.subject?.trim() ||
            conversation.lastMessagePreview ||
            "Konversation";

          return (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className={`grid gap-4 px-5 py-5 divlab-row-hover md:grid-cols-[minmax(0,1fr)_auto] md:items-start ${
                conversation.hasUnread ? "bg-divlab-blue/[0.06]" : ""
              }`}
            >
              <div className="flex min-w-0 items-start gap-4">
                <ProfileAvatar
                  avatarUrl={conversation.otherParticipant?.avatarUrl ?? null}
                  initials={conversation.otherParticipant?.initials ?? "DL"}
                  sizeClassName="h-12 w-12"
                  textClassName="text-sm"
                />
                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      {conversation.hasUnread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-divlab-blue" />
                      )}
                      <span className="truncate text-sm font-semibold text-divlab-text">
                        {conversation.otherParticipant?.name ?? DIVLAB_MEMBER_LABEL}
                      </span>
                    </div>
                    {conversation.otherParticipant?.username && (
                      <p className="mt-1 truncate text-xs text-divlab-text-muted">
                        @{conversation.otherParticipant.username}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm ${
                        conversation.hasUnread
                          ? "font-semibold text-divlab-text"
                          : "font-medium text-divlab-text-secondary"
                      }`}
                    >
                      {subject}
                    </p>
                    <p
                      className={`mt-1 truncate text-sm ${
                        conversation.hasUnread
                          ? "text-divlab-text-secondary"
                          : "text-divlab-text-muted"
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
                    conversation.hasUnread
                      ? "text-divlab-blue-muted"
                      : "text-divlab-text-muted"
                  }`}
                >
                  {formatMessageTimestamp(conversation.lastMessageAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function MessagesInbox({
  chats,
  requests,
  activeTab,
  errorMessage,
}: Props) {
  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 divlab-section-label">Meddelanden</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
              Chattar
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-divlab-text-secondary">
              Privata konversationer mellan DivLab-medlemmar. Håll tonen tydlig,
              respektfull och långsiktig.
            </p>
          </div>

          <Link href="/messages/new" className="divlab-btn-primary w-fit px-5 py-2.5">
            Nytt meddelande
          </Link>
        </div>
      </section>

      <div
        className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0"
        aria-label="Meddelandevyer"
      >
        <div className="flex w-max gap-2 pb-0.5" role="tablist">
          <Link
            href="/messages"
            role="tab"
            aria-selected={activeTab === "chats"}
            className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${
              activeTab === "chats"
                ? "divlab-selected"
                : "border-transparent bg-divlab-surface text-divlab-text-muted hover:text-divlab-text-secondary"
            }`}
          >
            Chattar
            <span className="ml-2 text-divlab-text-muted">{chats.length}</span>
          </Link>
          <Link
            href="/messages?tab=requests"
            role="tab"
            aria-selected={activeTab === "requests"}
            className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${
              activeTab === "requests"
                ? "divlab-selected"
                : "border-transparent bg-divlab-surface text-divlab-text-muted hover:text-divlab-text-secondary"
            }`}
          >
            Meddelandeförfrågningar
            <span className="ml-2 text-divlab-text-muted">{requests.length}</span>
          </Link>
        </div>
      </div>

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
      ) : activeTab === "requests" ? (
        <ConversationRows
          conversations={requests}
          emptyTitle="Inga meddelandeförfrågningar"
          emptyDescription="När någon som inte är din kontakt skickar ett första meddelande visas det här."
        />
      ) : (
        <ConversationRows
          conversations={chats}
          emptyTitle="Inga chattar ännu"
          emptyDescription="Starta en konversation från en användares profil, dina kontakter eller forumet."
        />
      )}
    </div>
  );
}
