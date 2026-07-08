import AppShell from "@/components/layout/AppShell";
import MessagesInbox from "@/components/messages/MessagesInbox";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import { getConversationSummaries } from "@/lib/messages/messages";
import type { ConversationSummary } from "@/lib/messages/types";

export default async function MessagesPage() {
  const { user, identity } = await requireAuthenticatedUserWithProfile();
  let conversations: ConversationSummary[] = [];
  let errorMessage: string | undefined;

  try {
    conversations = await getConversationSummaries(user.id);
  } catch {
    errorMessage =
      "Meddelanden är inte tillgängliga just nu. Kontrollera databasinställningarna och försök igen om en stund.";
  }

  return (
    <AppShell user={user} identity={identity}>
      <MessagesInbox conversations={conversations} errorMessage={errorMessage} />
    </AppShell>
  );
}
