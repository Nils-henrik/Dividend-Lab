import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import { getAvatarPublicUrl } from "@/lib/profiles/identity";
import { createClient } from "@/lib/supabase/server";
import type {
  ContactConnectionRow,
  ContactListItem,
  ContactProfileSummary,
  ContactRequestItem,
  ProfileContactState,
} from "./types";

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

function mapProfileSummary(
  profile: ProfileRow | undefined,
  userId: string,
): ContactProfileSummary {
  const username = profile?.username?.trim() || null;
  const name = profile?.display_name?.trim() || username || DIVLAB_MEMBER_LABEL;

  return {
    id: userId,
    name,
    username,
    initials: getInitials(name),
    avatarUrl: getAvatarPublicUrl(profile?.avatar_path, profile?.updated_at),
  };
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

function mapConnection(row: ContactConnectionRow) {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at,
  };
}

export async function getAcceptedContactCount(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_accepted_contact_count", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return typeof data === "number" ? data : Number(data ?? 0);
}

export async function getConnectionBetweenUsers(
  currentUserId: string,
  otherUserId: string,
) {
  const supabase = await createClient();
  const userLowId =
    currentUserId < otherUserId ? currentUserId : otherUserId;
  const userHighId =
    currentUserId < otherUserId ? otherUserId : currentUserId;

  const { data, error } = await supabase
    .from("user_connections")
    .select(
      "id, requester_id, addressee_id, user_low_id, user_high_id, status, created_at, updated_at, responded_at",
    )
    .eq("user_low_id", userLowId)
    .eq("user_high_id", userHighId)
    .maybeSingle<ContactConnectionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapConnection(data) : null;
}

export async function getProfileContactState(
  viewerUserId: string | null,
  profileUserId: string,
): Promise<ProfileContactState> {
  if (!viewerUserId) {
    return { kind: "signed_out" };
  }

  if (viewerUserId === profileUserId) {
    return { kind: "self" };
  }

  const connection = await getConnectionBetweenUsers(viewerUserId, profileUserId);

  if (!connection || connection.status === "rejected" || connection.status === "cancelled" || connection.status === "removed") {
    return { kind: "none" };
  }

  if (connection.status === "accepted") {
    return { kind: "accepted", connectionId: connection.id };
  }

  if (connection.status === "pending") {
    if (connection.requesterId === viewerUserId) {
      return { kind: "outgoing_pending", connectionId: connection.id };
    }

    return { kind: "incoming_pending", connectionId: connection.id };
  }

  return { kind: "none" };
}

export async function getAcceptedContacts(userId: string): Promise<ContactListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_connections")
    .select(
      "id, requester_id, addressee_id, user_low_id, user_high_id, status, created_at, updated_at, responded_at",
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("responded_at", { ascending: false })
    .returns<ContactConnectionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const otherUserIds = (data ?? []).map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  );
  const profiles = await getProfilesByUserId(otherUserIds);

  return (data ?? []).map((row) => {
    const otherUserId =
      row.requester_id === userId ? row.addressee_id : row.requester_id;

    return {
      connectionId: row.id,
      profile: mapProfileSummary(profiles.get(otherUserId), otherUserId),
      since: row.responded_at ?? row.updated_at,
    };
  });
}

export async function getIncomingContactRequests(
  userId: string,
): Promise<ContactRequestItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_connections")
    .select(
      "id, requester_id, addressee_id, user_low_id, user_high_id, status, created_at, updated_at, responded_at",
    )
    .eq("status", "pending")
    .eq("addressee_id", userId)
    .order("created_at", { ascending: false })
    .returns<ContactConnectionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const requesterIds = (data ?? []).map((row) => row.requester_id);
  const profiles = await getProfilesByUserId(requesterIds);

  return (data ?? []).map((row) => ({
    connectionId: row.id,
    profile: mapProfileSummary(profiles.get(row.requester_id), row.requester_id),
    createdAt: row.created_at,
  }));
}

export async function getOutgoingContactRequests(
  userId: string,
): Promise<ContactRequestItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_connections")
    .select(
      "id, requester_id, addressee_id, user_low_id, user_high_id, status, created_at, updated_at, responded_at",
    )
    .eq("status", "pending")
    .eq("requester_id", userId)
    .order("created_at", { ascending: false })
    .returns<ContactConnectionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const addresseeIds = (data ?? []).map((row) => row.addressee_id);
  const profiles = await getProfilesByUserId(addresseeIds);

  return (data ?? []).map((row) => ({
    connectionId: row.id,
    profile: mapProfileSummary(profiles.get(row.addressee_id), row.addressee_id),
    createdAt: row.created_at,
  }));
}
