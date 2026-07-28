import AppShell from "@/components/layout/AppShell";
import ContactsManager from "@/components/contacts/ContactsManager";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import {
  getAcceptedContacts,
  getIncomingContactRequests,
  getOutgoingContactRequests,
} from "@/lib/contacts/contacts";
import type {
  ContactListItem,
  ContactRequestItem,
} from "@/lib/contacts/types";

export default async function ContactsPage() {
  const { user, identity } = await requireAuthenticatedUserWithProfile();
  let accepted: ContactListItem[] = [];
  let incoming: ContactRequestItem[] = [];
  let outgoing: ContactRequestItem[] = [];
  let errorMessage: string | undefined;

  try {
    [accepted, incoming, outgoing] = await Promise.all([
      getAcceptedContacts(user.id),
      getIncomingContactRequests(user.id),
      getOutgoingContactRequests(user.id),
    ]);
  } catch {
    errorMessage =
      "Kontakter är inte tillgängliga just nu. Försök igen om en stund.";
  }

  return (
    <AppShell user={user} identity={identity}>
      <ContactsManager
        accepted={accepted}
        incoming={incoming}
        outgoing={outgoing}
        errorMessage={errorMessage}
      />
    </AppShell>
  );
}
