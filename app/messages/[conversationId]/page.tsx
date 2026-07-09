import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ConversationThreadView from "@/components/messages/ConversationThreadView";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import {
  getConversationThread,
  markConversationRead,
} from "@/lib/messages/messages";

type Props = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const { user, identity } = await requireAuthenticatedUserWithProfile();
  const conversation = await getConversationThread(user.id, conversationId);

  if (conversation) {
    await markConversationRead(user.id, conversationId);
  }

  return (
    <AppShell user={user} identity={identity}>
      {conversation ? (
        <ConversationThreadView conversation={conversation} currentUserId={user.id} />
      ) : (
        <section className="divlab-card p-8">
          <p className="text-lg font-semibold text-divlab-text">
            Konversationen kunde inte öppnas
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            Den kan vara borttagen, eller så har du inte tillgång till den.
          </p>
          <Link href="/messages" className="divlab-btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm">
            Till inkorgen
          </Link>
        </section>
      )}
    </AppShell>
  );
}
