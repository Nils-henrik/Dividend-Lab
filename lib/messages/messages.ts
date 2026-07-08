import { getAvatarPublicUrl } from "@/lib/profiles/identity";
import { createClient } from "@/lib/supabase/server";
import type {
  ConversationMessage,
  ConversationSummary,
  ConversationThread,
  MessageParticipant,
} from "./types";

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
};

type ConversationRow = {
  id: string;
  updated_at: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  updated_at: string;
};

function getInitials(value: string) {
  const initials = value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "DL";
}

function mapParticipantProfile(profile: ProfileRow | undefined, userId: string) {
  const username = profile?.username?.trim() || null;
  const name = profile?.display_name?.trim() || username || "Dividend Lab-medlem";

  return {
    id: userId,
    name,
    username,
    initials: getInitials(name),
    avatarUrl: getAvatarPublicUrl(profile?.avatar_path, profile?.updated_at),
  } satisfies MessageParticipant;
}

async function getProfilesByUserId(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, updated_at")
    .in("id", userIds)
    .returns<ProfileRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

export async function getProfileByUserId(userId: string) {
  const profiles = await getProfilesByUserId([userId]);

  return profiles.get(userId) ?? null;
}

export async function getMessageParticipantByUserId(userId: string) {
  const profile = await getProfileByUserId(userId);

  return profile ? mapParticipantProfile(profile, userId) : null;
}

export async function getProfileByUsername(username: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, updated_at")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function getConversationSummaries(userId: string) {
  const supabase = await createClient();
  const { data: ownParticipants, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, last_read_at")
    .eq("user_id", userId)
    .returns<ParticipantRow[]>();

  if (participantError) {
    throw new Error(participantError.message);
  }

  const conversationIds = (ownParticipants ?? []).map(
    (participant) => participant.conversation_id,
  );

  if (conversationIds.length === 0) {
    return [];
  }

  const [
    { data: conversations, error: conversationError },
    { data: participants, error: allParticipantsError },
    { data: messages, error: messagesError },
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, updated_at, created_at")
      .in("id", conversationIds)
      .returns<ConversationRow[]>(),
    supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, last_read_at")
      .in("conversation_id", conversationIds)
      .returns<ParticipantRow[]>(),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })
      .returns<MessageRow[]>(),
  ]);

  if (conversationError) {
    throw new Error(conversationError.message);
  }

  if (allParticipantsError) {
    throw new Error(allParticipantsError.message);
  }

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const userIds = Array.from(
    new Set((participants ?? []).map((participant) => participant.user_id)),
  );
  const profilesByUserId = await getProfilesByUserId(userIds);
  const ownParticipantByConversationId = new Map(
    (ownParticipants ?? []).map((participant) => [
      participant.conversation_id,
      participant,
    ]),
  );
  const participantsByConversationId = new Map<string, ParticipantRow[]>();
  const lastMessageByConversationId = new Map<string, MessageRow>();

  for (const participant of participants ?? []) {
    const conversationParticipants =
      participantsByConversationId.get(participant.conversation_id) ?? [];
    conversationParticipants.push(participant);
    participantsByConversationId.set(
      participant.conversation_id,
      conversationParticipants,
    );
  }

  for (const message of messages ?? []) {
    if (!lastMessageByConversationId.has(message.conversation_id)) {
      lastMessageByConversationId.set(message.conversation_id, message);
    }
  }

  return (conversations ?? [])
    .map((conversation) => {
      const conversationParticipants =
        participantsByConversationId.get(conversation.id) ?? [];
      const otherParticipant = conversationParticipants.find(
        (participant) => participant.user_id !== userId,
      );
      const ownParticipant = ownParticipantByConversationId.get(conversation.id);
      const lastMessage = lastMessageByConversationId.get(conversation.id);
      const lastReadAt = ownParticipant?.last_read_at;
      const hasUnread = lastMessage
        ? lastMessage.sender_id !== userId &&
          (!lastReadAt ||
            new Date(lastMessage.created_at).getTime() >
              new Date(lastReadAt).getTime())
        : false;

      return {
        id: conversation.id,
        updatedAt: conversation.updated_at ?? conversation.created_at,
        otherParticipant: otherParticipant
          ? mapParticipantProfile(
              profilesByUserId.get(otherParticipant.user_id),
              otherParticipant.user_id,
            )
          : null,
        lastMessagePreview: lastMessage?.body ?? "Inga meddelanden än",
        lastMessageAt: lastMessage?.created_at ?? null,
        hasUnread,
      } satisfies ConversationSummary;
    })
    .sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
    );
}

export async function getUnreadMessageCount(userId: string) {
  const supabase = await createClient();
  const { data: ownParticipants, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, created_at, last_read_at")
    .eq("user_id", userId)
    .returns<(ParticipantRow & { created_at: string })[]>();

  if (participantError) {
    throw new Error(participantError.message);
  }

  const conversationIds = (ownParticipants ?? []).map(
    (participant) => participant.conversation_id,
  );

  if (conversationIds.length === 0) {
    return 0;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("conversation_id, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .returns<Pick<MessageRow, "conversation_id" | "sender_id" | "created_at">[]>();

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const ownParticipantByConversationId = new Map(
    (ownParticipants ?? []).map((participant) => [
      participant.conversation_id,
      participant,
    ]),
  );
  const unreadConversationIds = new Set<string>();

  for (const message of messages ?? []) {
    const ownParticipant = ownParticipantByConversationId.get(
      message.conversation_id,
    );
    const readBoundary = ownParticipant?.last_read_at ?? ownParticipant?.created_at;

    if (
      readBoundary &&
      new Date(message.created_at).getTime() > new Date(readBoundary).getTime()
    ) {
      unreadConversationIds.add(message.conversation_id);
    }
  }

  return unreadConversationIds.size;
}

export async function getConversationThread(
  userId: string,
  conversationId: string,
) {
  const supabase = await createClient();
  const { data: participants, error: participantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, last_read_at")
    .eq("conversation_id", conversationId)
    .returns<ParticipantRow[]>();

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  if (!participants?.some((participant) => participant.user_id === userId)) {
    return null;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const otherParticipant = participants.find(
    (participant) => participant.user_id !== userId,
  );
  const profilesByUserId = await getProfilesByUserId(
    participants.map((participant) => participant.user_id),
  );

  return {
    id: conversationId,
    otherParticipant: otherParticipant
      ? mapParticipantProfile(
          profilesByUserId.get(otherParticipant.user_id),
          otherParticipant.user_id,
        )
      : null,
    messages: (messages ?? []).map(
      (message) =>
        ({
          id: message.id,
          conversationId: message.conversation_id,
          senderId: message.sender_id,
          body: message.body,
          createdAt: message.created_at,
        }) satisfies ConversationMessage,
    ),
  } satisfies ConversationThread;
}

export async function markConversationRead(userId: string, conversationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
