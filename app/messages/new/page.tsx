import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import NewConversationForm from "@/components/messages/NewConversationForm";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import {
  areAcceptedContacts,
  findConversationIdBetweenUsers,
  getMessageParticipantByUserId,
  getMessageParticipantByUsername,
} from "@/lib/messages/messages";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    userId?: string;
    username?: string;
  }>;
};

export default async function NewMessagePage({ searchParams }: Props) {
  const { userId, username } = await searchParams;
  const { user, identity } = await requireAuthenticatedUserWithProfile();
  const targetParticipant = userId
    ? await getMessageParticipantByUserId(userId)
    : username
      ? await getMessageParticipantByUsername(username)
      : null;
  const initialUsername = username?.trim().replace(/^@/, "").toLowerCase() ?? "";
  const isSelfTarget = targetParticipant?.id === user.id;
  let isMessageRequest = false;

  if (targetParticipant && !isSelfTarget) {
    const existingId = await findConversationIdBetweenUsers(
      user.id,
      targetParticipant.id,
    );

    if (existingId) {
      redirect(`/messages/${existingId}`);
    }

    const areContacts = await areAcceptedContacts(user.id, targetParticipant.id);
    isMessageRequest = !areContacts;

    if (areContacts) {
      const supabase = await createClient();
      const { data: conversationId, error } = await supabase.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: targetParticipant.id,
          p_initial_body: null,
          p_subject: null,
        },
      );

      if (!error && conversationId) {
        redirect(`/messages/${conversationId}`);
      }
    }
  }

  return (
    <AppShell user={user} identity={identity}>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="divlab-hero">
          <div>
            <p className="mb-3 divlab-section-label">Meddelanden</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
              {isMessageRequest ? "Meddelandeförfrågan" : "Ny konversation"}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-divlab-text-secondary">
              Skriv ett kort, tydligt meddelande till en annan medlem. E-post
              visas aldrig i meddelanden.
            </p>
          </div>
        </section>

        <section className="divlab-card p-6">
          {isSelfTarget ? (
            <div className="space-y-5">
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
                Du kan inte starta en konversation med dig själv.
              </p>
              <Link
                href="/messages"
                className="divlab-btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm"
              >
                Till inkorgen
              </Link>
            </div>
          ) : userId && !targetParticipant ? (
            <div className="space-y-5">
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
                Vi hittade inte användaren. Kontrollera länken eller starta med
                ett användarnamn.
              </p>
              <NewConversationForm initialUsername={initialUsername} />
            </div>
          ) : (
            <NewConversationForm
              targetParticipant={targetParticipant}
              initialUsername={initialUsername}
              isMessageRequest={isMessageRequest}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
