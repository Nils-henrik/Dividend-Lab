const PUBLIC_MEMBER_FALLBACK = "medlem";

export function getForumAuthorLabel(
  username: string | null | undefined,
  displayName: string | null | undefined,
) {
  const normalizedUsername = username?.trim();

  if (normalizedUsername) {
    return `@${normalizedUsername}`;
  }

  const normalizedDisplayName = displayName?.trim();

  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  return "Dividend Lab-medlem";
}

export function getForumAuthorUsername(
  username: string | null | undefined,
  displayName: string | null | undefined,
) {
  const normalizedUsername = username?.trim();

  if (normalizedUsername) {
    return normalizedUsername;
  }

  const normalizedDisplayName = displayName?.trim();

  if (normalizedDisplayName) {
    return normalizedDisplayName.replace(/\s+/g, "-").toLowerCase();
  }

  return PUBLIC_MEMBER_FALLBACK;
}

export function getForumAuthorInitials(
  username: string | null | undefined,
  displayName: string | null | undefined,
) {
  const label = getForumAuthorLabel(username, displayName).replace(/^@/, "");
  const initials = label
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "DL";
}

export function formatForumTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Okänt datum";
  }

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (isSameDay) {
    return `Idag kl. ${time}`;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatForumRelativeActivity(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min sedan`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} tim sedan`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} d sedan`;
  }

  return formatForumTimestamp(value);
}

export function formatForumMemberSince(profileCreatedAt: string | null) {
  if (!profileCreatedAt) {
    return "Dividend Lab-medlem";
  }

  const date = new Date(profileCreatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Dividend Lab-medlem";
  }

  const year = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
  }).format(date);

  return `Medlem sedan ${year}`;
}

export function createForumThreadSlug(title: string) {
  const base =
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "discussion";

  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  return `${base}-${suffix}`;
}

export function getForumExcerpt(body: string, maxLength = 160) {
  const normalized = body.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}
