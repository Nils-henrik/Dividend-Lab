import { getAuthenticatedUser, requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/auth/user";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import { getNotificationBellData } from "@/lib/notifications/feed";
import type { NotificationFeedItem } from "@/lib/notifications/types";
import { getProfileForUser } from "@/lib/profiles/profile";
import { getUserDisplayIdentity, GUEST_DISPLAY_IDENTITY } from "@/lib/profiles/identity";
import AppShellClient from "./AppShellClient";

type Props = {
  children: React.ReactNode;
  user?: AuthenticatedUser;
  identity?: UserDisplayIdentity;
  allowGuest?: boolean;
};

const emptyBell = {
  unreadMessageCount: 0,
  unreadCount: 0,
  items: [] as NotificationFeedItem[],
  userId: null as string | null,
};

async function loadBellData(userId: string) {
  try {
    const data = await getNotificationBellData(userId);
    return {
      unreadMessageCount: data.unreadMessageCount,
      unreadCount: data.unreadCount,
      items: data.items,
      userId,
    };
  } catch {
    return {
      ...emptyBell,
      userId,
    };
  }
}

export default async function AppShell({
  children,
  user,
  identity,
  allowGuest = false,
}: Props) {
  if (user) {
    const profile = identity ? null : await getProfileForUser(user.id);
    const displayIdentity = identity ?? getUserDisplayIdentity(user, profile);
    const bell = await loadBellData(user.id);

    return (
      <AppShellClient
        user={displayIdentity}
        unreadMessageCount={bell.unreadMessageCount}
        unreadNotificationCount={bell.unreadCount}
        notificationItems={bell.items}
        notificationUserId={bell.userId}
      >
        {children}
      </AppShellClient>
    );
  }

  const authenticatedUser = await getAuthenticatedUser();

  if (authenticatedUser) {
    const session = await requireAuthenticatedUserWithProfile();
    const bell = await loadBellData(session.user.id);

    return (
      <AppShellClient
        user={session.identity}
        unreadMessageCount={bell.unreadMessageCount}
        unreadNotificationCount={bell.unreadCount}
        notificationItems={bell.items}
        notificationUserId={bell.userId}
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
        unreadNotificationCount={0}
        notificationItems={[]}
        notificationUserId={null}
        isGuest
      >
        {children}
      </AppShellClient>
    );
  }

  const session = await requireAuthenticatedUserWithProfile();
  const bell = await loadBellData(session.user.id);

  return (
    <AppShellClient
      user={session.identity}
      unreadMessageCount={bell.unreadMessageCount}
      unreadNotificationCount={bell.unreadCount}
      notificationItems={bell.items}
      notificationUserId={bell.userId}
    >
      {children}
    </AppShellClient>
  );
}
