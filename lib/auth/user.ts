import type { User } from "@supabase/supabase-js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  createdAt: string | null;
};

function formatNameFromEmail(email: string) {
  const [localPart] = email.split("@");
  const normalizedName = localPart.replace(/[._-]+/g, " ").trim();

  if (!normalizedName) {
    return "Investor";
  }

  return normalizedName
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string, email: string) {
  const source = name === "Investor" ? email : name;
  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "DL";
}

export function mapSupabaseUser(user: User): AuthenticatedUser {
  const email = user.email ?? "";
  const metadataName =
    typeof user.user_metadata.name === "string"
      ? user.user_metadata.name
      : typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : "";
  const name = metadataName.trim() || formatNameFromEmail(email);

  return {
    id: user.id,
    email,
    name,
    initials: getInitials(name, email),
    createdAt: user.created_at ?? null,
  };
}
