import { getAuthenticatedUser, requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/auth/user";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import { getUnreadMessageCount } from "@/lib/messages/messages";
import { getProfileForUser } from "@/lib/profiles/profile";
import { getUserDisplayIdentity, GUEST_DISPLAY_IDENTITY } from "@/lib/profiles/identity";
import AppShellClient from "./AppShellClient";

type Props = {
  children: React.ReactNode;
  user?: AuthenticatedUser;
  identity?: UserDisplayIdentity;
  allowGuest?: boolean;
};

export default async function AppShell({
  children,
  user,
  identity,
  allowGuest = false,
}: Props) {
  if (user) {
    const profile = identity ? null : await getProfileForUser(user.id);
    const displayIdentity = identity ?? getUserDisplayIdentity(user, profile);
    let unreadMessageCount = 0;

    try {
      unreadMessageCount = await getUnreadMessageCount(user.id);
    } catch {
      unreadMessageCount = 0;
    }

    return (
      <AppShellClient user={displayIdentity} unreadMessageCount={unreadMessageCount}>
        {children}
      </AppShellClient>
    );
  }

  const authenticatedUser = await getAuthenticatedUser();

  if (authenticatedUser) {
    const session = await requireAuthenticatedUserWithProfile();
    let unreadMessageCount = 0;

    try {
      unreadMessageCount = await getUnreadMessageCount(session.user.id);
    } catch {
      unreadMessageCount = 0;
    }

    return (
      <AppShellClient
        user={session.identity}
        unreadMessageCount={unreadMessageCount}
      >
        {children}
      </AppShellClient>
    );
  }

  if (allowGuest) {
    return (
      <AppShellClient
        user={GUEST_DISPLAY_IDENTITY}
        unreadMessageCount={0}
        isGuest
      >
        {children}
      </AppShellClient>
    );
  }

  const session = await requireAuthenticatedUserWithProfile();
  let unreadMessageCount = 0;

  try {
    unreadMessageCount = await getUnreadMessageCount(session.user.id);
  } catch {
    unreadMessageCount = 0;
  }

  return (
    <AppShellClient
      user={session.identity}
      unreadMessageCount={unreadMessageCount}
    >
      {children}
    </AppShellClient>
  );
}
