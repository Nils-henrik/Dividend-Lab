import Link from "next/link";
import { buildDivBrainHref } from "@/lib/divbrain/brain-routes";
import type { DivBrainShellViewModel } from "@/lib/divbrain/server/ui";
import DivBrainChatPane from "./DivBrainChatPane";
import DivBrainConversationActions from "./DivBrainConversationActions";
import DivBrainConversationRail from "./DivBrainConversationRail";
import DivBrainDisabledComposer from "./DivBrainDisabledComposer";
import DivBrainEmptyState from "./DivBrainEmptyState";
import DivBrainHeader from "./DivBrainHeader";
import DivBrainHistoryDrawer from "./DivBrainHistoryDrawer";
import DivBrainTranscript from "./DivBrainTranscript";

type Props = {
  view: DivBrainShellViewModel;
};

export default function DivBrainShell({ view }: Props) {
  const conversations =
    view.state === "data_unavailable" ? [] : view.conversations;
  const hasMoreConversations =
    view.state === "data_unavailable" ? false : view.hasMoreConversations;
  const archiveScope =
    view.state === "data_unavailable" ? "active" : view.archiveScope;
  const selectedConversationId =
    view.state === "ready" ? view.selectedConversation.id : null;

  return (
    <section className="flex flex-col gap-3">
      <DivBrainHeader />

      <div className="lg:hidden">
        <DivBrainHistoryDrawer
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          hasMoreConversations={hasMoreConversations}
          archiveScope={archiveScope}
        />
      </div>

      <div className="flex h-[calc(100dvh-11rem)] min-h-[30rem] flex-col gap-3 lg:h-[calc(100dvh-11.5rem)] lg:min-h-[34rem] lg:flex-row lg:items-stretch lg:gap-4">
        <aside className="hidden h-full w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-72 xl:w-80">
          <DivBrainConversationRail
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            hasMoreConversations={hasMoreConversations}
            archiveScope={archiveScope}
          />
        </aside>

        <div className="divlab-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {view.state === "data_unavailable" ? (
            <DivBrainUnavailablePanel
              title="DivBrain kunde inte laddas"
              description="Konversationerna är inte tillgängliga just nu. Försök igen senare."
              href="/brain"
              linkLabel="Ladda om DivBrain"
            />
          ) : null}

          {view.state === "conversation_not_found" ? (
            <DivBrainUnavailablePanel
              title="Konversationen hittades inte"
              description="Den kan ha tagits bort eller är inte tillgänglig för det här kontot."
              href={buildDivBrainHref({ archiveScope: view.archiveScope })}
              linkLabel="Tillbaka till DivBrain"
            />
          ) : null}

          {view.state === "empty" ? (
            <DivBrainEmptyState archiveScope={view.archiveScope} />
          ) : null}

          {view.state === "ready" ? (
            <>
              <div className="z-10 shrink-0 border-b divlab-border-neutral bg-divlab-surface/95 px-4 py-3 backdrop-blur sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="min-w-0 truncate text-base font-semibold tracking-[-0.03em] text-divlab-text sm:text-lg">
                      {view.selectedConversation.title}
                    </h2>
                    {view.selectedConversation.archived ? (
                      <span className="rounded-md border border-divlab-border bg-divlab-elevated px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-divlab-text-muted">
                        Arkiverad
                      </span>
                    ) : null}
                  </div>
                  <DivBrainConversationActions
                    conversationId={view.selectedConversation.id}
                    title={view.selectedConversation.title}
                    archived={view.selectedConversation.archived}
                    archiveScope={view.archiveScope}
                  />
                </div>
              </div>

              {view.selectedConversation.archived ? (
                <>
                  <DivBrainTranscript
                    transcript={view.selectedConversation.transcript}
                  />
                  <DivBrainDisabledComposer
                    conversationId={view.selectedConversation.id}
                    archived
                  />
                </>
              ) : (
                <DivBrainChatPane
                  conversationId={view.selectedConversation.id}
                  transcript={view.selectedConversation.transcript}
                />
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DivBrainUnavailablePanel({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-4 overflow-y-auto px-5 py-10 sm:px-8">
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
        {title}
      </h2>
      <p className="max-w-xl text-sm leading-6 text-divlab-text-secondary">
        {description}
      </p>
      <Link href={href} className="divlab-btn-ghost inline-flex min-h-10 items-center">
        {linkLabel}
      </Link>
    </div>
  );
}
