import type { AuthenticatedUser } from "@/lib/auth/user";
import type { UserProfile } from "./types";

export type UserDisplayIdentity = {
  id: string;
  email: string;
  name: string;
  initials: string;
  username: string | null;
  avatarUrl: string | null;
};

const PUBLIC_IDENTITY_FALLBACK = "Dividend Lab Member";

export function getAvatarPublicUrl(
  avatarPath: string | null | undefined,
  version?: string | null,
) {
  if (!avatarPath) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  const encodedPath = avatarPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const cacheVersion = version ? `?v=${encodeURIComponent(version)}` : "";

  return `${supabaseUrl}/storage/v1/object/public/avatars/${encodedPath}${cacheVersion}`;
}

function getInitials(value: string) {
  const initials = value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "DL";
}

export function getUserDisplayIdentity(
  user: AuthenticatedUser,
  profile: UserProfile | null,
): UserDisplayIdentity {
  const displayName = profile?.displayName?.trim();
  const username = profile?.username?.trim();
  const identityName = displayName || username || PUBLIC_IDENTITY_FALLBACK;

  return {
    id: user.id,
    email: user.email,
    name: identityName,
    initials: getInitials(identityName),
    username: username || null,
    avatarUrl: getAvatarPublicUrl(profile?.avatarPath, profile?.updatedAt),
  };
}
