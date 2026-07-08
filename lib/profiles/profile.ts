import { createClient } from "@/lib/supabase/server";
import type {
  ProfileFormValues,
  ProfileRow,
  ProfileUpdateInput,
  UserProfile,
} from "./types";
import { validateProfileValues } from "./validation";

function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    favoriteSector: row.favorite_sector,
    investorGoal: row.investor_goal,
    avatarPath: row.avatar_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeProfileInput(values: ProfileUpdateInput) {
  const input: {
    username: string | null;
    display_name: string | null;
    bio: string | null;
    favorite_sector: string | null;
    investor_goal: string | null;
    avatar_path?: string | null;
  } = {
    username: values.username ?? null,
    display_name: values.displayName ?? null,
    bio: values.bio ?? null,
    favorite_sector: values.favoriteSector ?? null,
    investor_goal: values.investorGoal ?? null,
  };

  if (values.avatarPath !== undefined) {
    input.avatar_path = values.avatarPath;
  }

  return input;
}

export function profileToFormValues(
  profile: UserProfile | null,
): ProfileFormValues {
  return {
    username: profile?.username ?? "",
    displayName: profile?.displayName ?? "",
    bio: profile?.bio ?? "",
    favoriteSector: profile?.favoriteSector ?? "",
    investorGoal: profile?.investorGoal ?? "",
  };
}

export async function getProfileForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, favorite_sector, investor_goal, avatar_path, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapProfileRow(data) : null;
}

export async function getPublicProfileByUsername(username: string) {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();

  if (!normalizedUsername) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, favorite_sector, investor_goal, avatar_path, created_at, updated_at",
    )
    .eq("username", normalizedUsername)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapProfileRow(data) : null;
}

export async function ensureProfileForUser(userId: string) {
  const existingProfile = await getProfileForUser(userId);

  if (existingProfile) {
    return existingProfile;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select(
      "id, username, display_name, bio, favorite_sector, investor_goal, avatar_path, created_at, updated_at",
    )
    .single<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapProfileRow(data);
}

export async function updateProfileForUser(
  userId: string,
  values: ProfileFormValues & { avatarPath?: string | null },
) {
  const validation = validateProfileValues(values);

  if (validation.errors.length > 0) {
    return {
      profile: null,
      error: validation.errors[0],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        ...normalizeProfileInput({
          ...validation.values,
          avatarPath: values.avatarPath,
        }),
      },
      { onConflict: "id" },
    )
    .select(
      "id, username, display_name, bio, favorite_sector, investor_goal, avatar_path, created_at, updated_at",
    )
    .single<ProfileRow>();

  if (error) {
    return {
      profile: null,
      error:
        error.code === "23505"
          ? "That username is already taken."
          : error.message,
    };
  }

  return {
    profile: mapProfileRow(data),
    error: null,
  };
}
