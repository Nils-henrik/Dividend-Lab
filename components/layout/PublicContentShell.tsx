import AppShell from "@/components/layout/AppShell";
import PublicPageShell from "@/components/layout/PublicPageShell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getUserDisplayIdentity } from "@/lib/profiles/identity";
import { getProfileForUser } from "@/lib/profiles/profile";

type Props = {
  children: React.ReactNode;
  /** Extra class on the public main content wrapper. */
  publicContentClassName?: string;
};

/**
 * Authenticated users keep AppShell; guests get the shared public marketing shell.
 * Avoids nested headers and dual primary navigation.
 */
export default async function PublicContentShell({
  children,
  publicContentClassName,
}: Props) {
  const user = await getAuthenticatedUser();

  if (user) {
    const profile = await getProfileForUser(user.id);
    const identity = getUserDisplayIdentity(user, profile);

    return (
      <AppShell user={user} identity={identity}>
        {children}
      </AppShell>
    );
  }

  return (
    <PublicPageShell contentClassName={publicContentClassName}>
      {children}
    </PublicPageShell>
  );
}
