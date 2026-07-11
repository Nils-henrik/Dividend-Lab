export const FORUM_STATUS_TIERS = [
  {
    id: "new_member",
    label: "Ny medlem",
    minimumContributions: 0,
    minimumReceivedReactions: 0,
    description: "Har börjat delta i forumet.",
  },
  {
    id: "active_member",
    label: "Aktiv medlem",
    minimumContributions: 5,
    minimumReceivedReactions: 3,
    description: "Deltar regelbundet och har fått uppskattning från andra.",
  },
  {
    id: "contributing_member",
    label: "Bidragande medlem",
    minimumContributions: 15,
    minimumReceivedReactions: 10,
    description: "Bidrar återkommande med innehåll som uppskattas av communityn.",
  },
  {
    id: "established_member",
    label: "Etablerad medlem",
    minimumContributions: 40,
    minimumReceivedReactions: 30,
    description:
      "Har byggt upp ett tydligt förtroende genom aktivitet och kvalitet.",
  },
  {
    id: "veteran",
    label: "Veteran",
    minimumContributions: 100,
    minimumReceivedReactions: 100,
    description: "En av forumets mest etablerade och uppskattade röster.",
  },
] as const;

export type ForumStatusId = (typeof FORUM_STATUS_TIERS)[number]["id"];

export type ForumStatusTier = {
  id: ForumStatusId;
  label: string;
  description: string;
  minimumContributions: number;
  minimumReceivedReactions: number;
};

export type ForumStatusProgress = {
  currentStatus: ForumStatusTier;
  nextStatus: ForumStatusTier | null;
  remainingContributions: number;
  remainingReactions: number;
};

function normalizeCount(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

export function getForumStatusProgress(
  contributionCount: number,
  totalReceivedReactions: number,
): ForumStatusProgress {
  const contributions = normalizeCount(contributionCount);
  const reactions = normalizeCount(totalReceivedReactions);

  let currentTier: (typeof FORUM_STATUS_TIERS)[number] = FORUM_STATUS_TIERS[0];

  for (const tier of FORUM_STATUS_TIERS) {
    if (
      contributions >= tier.minimumContributions &&
      reactions >= tier.minimumReceivedReactions
    ) {
      currentTier = tier;
    }
  }

  const currentIndex = FORUM_STATUS_TIERS.indexOf(currentTier);
  const nextTier = FORUM_STATUS_TIERS[currentIndex + 1] ?? null;

  return {
    currentStatus: { ...currentTier },
    nextStatus: nextTier ? { ...nextTier } : null,
    remainingContributions: nextTier
      ? Math.max(0, nextTier.minimumContributions - contributions)
      : 0,
    remainingReactions: nextTier
      ? Math.max(0, nextTier.minimumReceivedReactions - reactions)
      : 0,
  };
}

export function formatForumStatusProgressText(
  progress: ForumStatusProgress,
): string {
  if (!progress.nextStatus) {
    return "Högsta forumstatus uppnådd.";
  }

  const parts: string[] = [];

  if (progress.remainingContributions > 0) {
    parts.push(
      progress.remainingContributions === 1
        ? "1 bidrag"
        : `${progress.remainingContributions} bidrag`,
    );
  }

  if (progress.remainingReactions > 0) {
    parts.push(
      progress.remainingReactions === 1
        ? "1 mottagen reaktion"
        : `${progress.remainingReactions} mottagna reaktioner`,
    );
  }

  if (parts.length === 0) {
    return "Högsta forumstatus uppnådd.";
  }

  const requirement =
    parts.length === 2 ? `${parts[0]} och ${parts[1]}` : parts[0];

  return `Till ${progress.nextStatus.label}: ${requirement} kvar.`;
}
