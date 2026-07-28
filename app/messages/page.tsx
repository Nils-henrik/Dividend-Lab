import AppShell from "@/components/layout/AppShell";
import MessagesInbox from "@/components/messages/MessagesInbox";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import {
  getActiveConversationSummaries,
  getMessageRequestSummaries,
} from "@/lib/messages/messages";
import type { ConversationSummary } from "@/lib/messages/types";

type Props = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function MessagesPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const { user, identity } = await requireAuthenticatedUserWithProfile();
  let chats: ConversationSummary[] = [];
  let requests: ConversationSummary[] = [];
  let errorMessage: string | undefined;
  const activeTab = tab === "requests" ? "requests" : "chats";

  try {
    [chats, requests] = await Promise.all([
      getActiveConversationSummaries(user.id),
      getMessageRequestSummaries(user.id),
    ]);
  } catch {
    errorMessage =
      "Meddelanden är inte tillgängliga just nu. Kontrollera databasinställningarna och försök igen om en stund.";
  }

  return (
    <AppShell user={user} identity={identity}>
      <MessagesInbox
        chats={chats}
        requests={requests}
        activeTab={activeTab}
        errorMessage={errorMessage}
      />
    </AppShell>
  );
}
