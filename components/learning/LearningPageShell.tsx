import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getProfileForUser } from "@/lib/profiles/profile";
import { getUserDisplayIdentity } from "@/lib/profiles/identity";

type Props = {
  children: React.ReactNode;
};

export default async function LearningPageShell({ children }: Props) {
  const user = await getAuthenticatedUser();

  if (user) {
    const profile = await getProfileForUser(user.id);
    const identity = getUserDisplayIdentity(user, profile);

    return <AppShell user={user} identity={identity}>{children}</AppShell>;
  }

  return (
    <main className="min-h-screen bg-divlab-bg text-divlab-text">
      <header className="divlab-shell-header px-8 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/learning" className="divlab-link text-sm font-medium">
            Dividend Lab · Utbildning
          </Link>
          <Link
            href="/login?redirect=/learning"
            className="divlab-btn-secondary px-3 py-2 text-xs"
          >
            Logga in
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-8 py-8">{children}</div>
    </main>
  );
}
