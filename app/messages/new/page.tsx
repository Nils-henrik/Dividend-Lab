import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import NewConversationForm from "@/components/messages/NewConversationForm";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import {
  getMessageParticipantByUserId,
  getMessageParticipantByUsername,
} from "@/lib/messages/messages";

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

  return (
    <AppShell user={user} identity={identity}>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
          <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
              Meddelanden
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
              Ny konversation
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
              Skriv ett kort, tydligt meddelande till en annan medlem. E-post
              visas aldrig i meddelanden.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#161616] p-6">
          {isSelfTarget ? (
            <div className="space-y-5">
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
                Du kan inte starta en konversation med dig själv.
              </p>
              <Link
                href="/messages"
                className="inline-flex rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
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
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
