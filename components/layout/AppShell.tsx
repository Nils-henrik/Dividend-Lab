import { getAuthenticatedUser, requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/auth/user";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import { getGlobalChatBootstrap } from "@/lib/messages/chat-bootstrap";
import type { GlobalChatBootstrap } from "@/lib/messages/types";
import { isDivLabOwnerUser } from "@/lib/moderation/access.server";
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

const emptyChatBootstrap = {
  currentUserId: "",
  contacts: [],
  chats: [],
  requests: [],
  unreadCount: 0,
  shareActiveStatus: true,
  presenceByUserId: {},
} satisfies GlobalChatBootstrap;

async function loadChatBootstrap(userId: string) {
  try {
    return await getGlobalChatBootstrap(userId);
  } catch {
    return {
      ...emptyChatBootstrap,
      currentUserId: userId,
    };
  }
}

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
    const [bell, chatBootstrap, isOwner] = await Promise.all([
      loadBellData(user.id),
      loadChatBootstrap(user.id),
      isDivLabOwnerUser(user.id),
    ]);

    return (
      <AppShellClient
        user={displayIdentity}
        unreadMessageCount={bell.unreadMessageCount}
        unreadNotificationCount={bell.unreadCount}
        notificationItems={bell.items}
        notificationUserId={bell.userId}
        chatBootstrap={chatBootstrap}
        isModerator={isOwner}
        isOwner={isOwner}
      >
        {children}
      </AppShellClient>
    );
  }

  const authenticatedUser = await getAuthenticatedUser();

  if (authenticatedUser) {
    const session = await requireAuthenticatedUserWithProfile();
    const [bell, chatBootstrap, isOwner] = await Promise.all([
      loadBellData(session.user.id),
      loadChatBootstrap(session.user.id),
      isDivLabOwnerUser(session.user.id),
    ]);

    return (
      <AppShellClient
        user={session.identity}
        unreadMessageCount={bell.unreadMessageCount}
        unreadNotificationCount={bell.unreadCount}
        notificationItems={bell.items}
        notificationUserId={bell.userId}
        chatBootstrap={chatBootstrap}
        isModerator={isOwner}
        isOwner={isOwner}
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
        isModerator={false}
        isOwner={false}
      >
        {children}
      </AppShellClient>
    );
  }

  const session = await requireAuthenticatedUserWithProfile();
  const [bell, chatBootstrap, isOwner] = await Promise.all([
    loadBellData(session.user.id),
    loadChatBootstrap(session.user.id),
    isDivLabOwnerUser(session.user.id),
  ]);

  return (
    <AppShellClient
      user={session.identity}
      unreadMessageCount={bell.unreadMessageCount}
      unreadNotificationCount={bell.unreadCount}
      notificationItems={bell.items}
      notificationUserId={bell.userId}
      chatBootstrap={chatBootstrap}
      isModerator={isOwner}
      isOwner={isOwner}
    >
      {children}
    </AppShellClient>
  );
}
