export const FORUM_REPUTATION_BADGE_TIERS = [
  {
    id: "ny_medlem",
    label: "Ny medlem",
    minScore: 0,
    maxScore: 4,
    description: "Börjar bygga förtroende i forumet.",
  },
  {
    id: "hjalpsam_medlem",
    label: "Hjälpsam medlem",
    minScore: 5,
    maxScore: 24,
    description: "Bidrag som uppskattas av andra medlemmar.",
  },
  {
    id: "insiktsfull",
    label: "Insiktsfull",
    minScore: 25,
    maxScore: 74,
    description: "Genomtänkta perspektiv som lyfts fram av communityn.",
  },
  {
    id: "forumprofil",
    label: "Forumprofil",
    minScore: 75,
    maxScore: 199,
    description: "En etablerad röst i Dividend Lab-forumet.",
  },
  {
    id: "dividend_lab_veteran",
    label: "Dividend Lab Veteran",
    minScore: 200,
    maxScore: null,
    description: "Långsiktigt bidrag med konsekvent kvalitet och förtroende.",
  },
] as const;

export type ForumReputationBadgeId =
  (typeof FORUM_REPUTATION_BADGE_TIERS)[number]["id"];

export type ForumReputationBadge = {
  level: ForumReputationBadgeId;
  label: string;
  description: string;
  minScore: number;
  maxScore: number | null;
  score: number;
  nextLevel: {
    label: string;
    minScore: number;
    remaining: number;
  } | null;
};

function normalizeReputationScore(score: number) {
  if (!Number.isFinite(score) || score < 0) {
    return 0;
  }

  return Math.floor(score);
}

export function getForumReputationBadge(
  totalReceivedReactions: number,
): ForumReputationBadge {
  const score = normalizeReputationScore(totalReceivedReactions);

  const tier =
    FORUM_REPUTATION_BADGE_TIERS.find(
      (candidate) =>
        score >= candidate.minScore &&
        (candidate.maxScore === null || score <= candidate.maxScore),
    ) ?? FORUM_REPUTATION_BADGE_TIERS[0];

  const tierIndex = FORUM_REPUTATION_BADGE_TIERS.indexOf(tier);
  const nextTier = FORUM_REPUTATION_BADGE_TIERS[tierIndex + 1] ?? null;

  return {
    level: tier.id,
    label: tier.label,
    description: tier.description,
    minScore: tier.minScore,
    maxScore: tier.maxScore,
    score,
    nextLevel: nextTier
      ? {
          label: nextTier.label,
          minScore: nextTier.minScore,
          remaining: Math.max(0, nextTier.minScore - score),
        }
      : null,
  };
}
