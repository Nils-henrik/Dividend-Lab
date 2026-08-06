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

type ContactsSearchParams = {
  tab?: string | string[];
  request?: string | string[];
};

function readSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function resolveContactsTab(
  value: string | undefined,
): "accepted" | "incoming" | "outgoing" {
  if (value === "incoming" || value === "outgoing" || value === "accepted") {
    return value;
  }

  return "accepted";
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams?: Promise<ContactsSearchParams>;
}) {
  const { user, identity } = await requireAuthenticatedUserWithProfile();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialTab = resolveContactsTab(
    readSearchParam(resolvedSearchParams.tab),
  );
  const highlightedRequestId =
    readSearchParam(resolvedSearchParams.request) ?? null;
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
        initialTab={
          highlightedRequestId && initialTab === "accepted"
            ? "incoming"
            : initialTab
        }
        highlightedRequestId={highlightedRequestId}
      />
    </AppShell>
  );
}
