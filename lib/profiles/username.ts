export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const RESERVED_USERNAMES = [
  "divlab",
  "dividendlab",
  "admin",
  "administrator",
  "admins",
  "moderator",
  "moderators",
  "mod",
  "support",
  "help",
  "system",
  "official",
  "team",
  "staff",
  "root",
  "api",
  "security",
  "medlem",
  "anvandare",
] as const;

export type UsernameValidationResult =
  | { ok: true; username: string }
  | { ok: false; error: string };

export function normalizeUsername(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase();
}

export function isReservedUsername(username: string) {
  return (RESERVED_USERNAMES as readonly string[]).includes(username);
}

export function createTemporaryUsername() {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `u_${hex}`;
}

export function validateUsername(
  value: string | null | undefined,
  { required = true }: { required?: boolean } = {},
): UsernameValidationResult {
  const username = normalizeUsername(value);

  if (!username) {
    if (!required) {
      return { ok: true, username: "" };
    }

    return {
      ok: false,
      error: "Välj ett användarnamn.",
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error:
        "Användarnamnet måste vara 3–20 tecken och får bara innehålla a–z, 0–9 och _.",
    };
  }

  if (isReservedUsername(username)) {
    return {
      ok: false,
      error: "Det användarnamnet är reserverat. Välj ett annat.",
    };
  }

  return { ok: true, username };
}
