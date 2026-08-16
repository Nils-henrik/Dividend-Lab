import { getAcceptedContacts } from "@/lib/contacts/contacts";
import {
  getActiveConversationSummaries,
  getMessageRequestSummaries,
  getUnreadMessageCount,
} from "./messages";
import type {
  ChatContact,
  GlobalChatBootstrap,
  PresenceSnapshot,
} from "./types";
import { createClient } from "@/lib/supabase/server";

type PresenceRow = {
  user_id: string;
  last_seen_at: string | null;
  share_active_status: boolean;
};

export async function getOwnShareActiveStatus(userId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_presence")
      .select("share_active_status")
      .eq("user_id", userId)
      .maybeSingle<{ share_active_status: boolean }>();

    if (error) {
      return true;
    }

    return data?.share_active_status ?? true;
  } catch {
    return true;
  }
}

export async function getContactPresenceSnapshots(userIds: string[]) {
  const snapshots: Record<string, PresenceSnapshot> = {};

  if (userIds.length === 0) {
    return snapshots;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_presence")
      .select("user_id, last_seen_at, share_active_status")
      .in("user_id", userIds)
      .returns<PresenceRow[]>();

    if (error) {
      return snapshots;
    }

    for (const row of data ?? []) {
      snapshots[row.user_id] = {
        userId: row.user_id,
        lastSeenAt: row.last_seen_at ?? null,
        shareActiveStatus: row.share_active_status,
      };
    }
  } catch {
    return snapshots;
  }

  return snapshots;
}

export async function getGlobalChatBootstrap(
  userId: string,
): Promise<GlobalChatBootstrap> {
  const empty: GlobalChatBootstrap = {
    currentUserId: userId,
    contacts: [],
    chats: [],
    requests: [],
    unreadCount: 0,
    shareActiveStatus: true,
    presenceByUserId: {},
  };

  try {
    const [contacts, chats, requests, unreadCount, shareActiveStatus] =
      await Promise.all([
        getAcceptedContacts(userId).catch(() => []),
        getActiveConversationSummaries(userId).catch(() => []),
        getMessageRequestSummaries(userId).catch(() => []),
        getUnreadMessageCount(userId).catch(() => 0),
        getOwnShareActiveStatus(userId),
      ]);

    const conversationByOtherUserId = new Map(
      chats
        .filter((chat) => chat.otherParticipant)
        .map((chat) => [chat.otherParticipant!.id, chat]),
    );

    const chatContacts: ChatContact[] = contacts.map((contact) => {
      const existing = conversationByOtherUserId.get(contact.profile.id);

      return {
        userId: contact.profile.id,
        name: contact.profile.name,
        username: contact.profile.username,
        initials: contact.profile.initials,
        avatarUrl: contact.profile.avatarUrl,
        conversationId: existing?.id ?? null,
        hasUnread: existing?.hasUnread ?? false,
        lastActivityAt:
          existing?.lastMessageAt ?? existing?.updatedAt ?? contact.since,
      } satisfies ChatContact;
    });

    const presenceByUserId = await getContactPresenceSnapshots(
      chatContacts.map((contact) => contact.userId),
    );

    return {
      currentUserId: userId,
      contacts: chatContacts,
      chats,
      requests,
      unreadCount,
      shareActiveStatus,
      presenceByUserId,
    };
  } catch {
    return empty;
  }
}
