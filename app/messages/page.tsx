import AppShell from "@/components/layout/AppShell";
import MessagesInbox from "@/components/messages/MessagesInbox";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import { getConversationSummaries } from "@/lib/messages/messages";

export default async function MessagesPage() {
  const { user, identity } = await requireAuthenticatedUserWithProfile();
  const conversations = await getConversationSummaries(user.id);

  return (
    <AppShell user={user} identity={identity}>
      <MessagesInbox conversations={conversations} />
    </AppShell>
  );
}
