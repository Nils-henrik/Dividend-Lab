import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/auth/user";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import { getProfileForUser } from "@/lib/profiles/profile";
import { getUserDisplayIdentity } from "@/lib/profiles/identity";
import AppShellClient from "./AppShellClient";

type Props = {
  children: React.ReactNode;
  user?: AuthenticatedUser;
  identity?: UserDisplayIdentity;
};

export default async function AppShell({ children, user, identity }: Props) {
  if (user) {
    const profile = identity ? null : await getProfileForUser(user.id);
    const displayIdentity = identity ?? getUserDisplayIdentity(user, profile);

    return <AppShellClient user={displayIdentity}>{children}</AppShellClient>;
  }

  const session = await requireAuthenticatedUserWithProfile();

  return <AppShellClient user={session.identity}>{children}</AppShellClient>;
}
