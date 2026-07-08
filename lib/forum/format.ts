const PUBLIC_MEMBER_FALLBACK = "member";

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

  return "Dividend Lab Member";
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
    return "Unknown date";
  }

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (isSameDay) {
    return `Today at ${time}`;
  }

  return new Intl.DateTimeFormat("en-GB", {
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
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} d ago`;
  }

  return formatForumTimestamp(value);
}

export function formatForumMemberSince(profileCreatedAt: string | null) {
  if (!profileCreatedAt) {
    return "Dividend Lab member";
  }

  const date = new Date(profileCreatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Dividend Lab member";
  }

  const year = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
  }).format(date);

  return `Member since ${year}`;
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
