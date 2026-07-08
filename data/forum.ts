import {
  FORUM_DEMO_THREAD_SLUG,
  forumDemoPosts,
  forumDemoThread,
} from "@/data/forum-demo";
import type {
  ForumCategory,
  ForumCategoryGroup,
  ForumHelpfulMember,
  ForumPost,
  ForumThread,
} from "@/types/forum";

const category = (
  groupSlug: string,
  groupName: string,
  slug: string,
  name: string,
  description: string,
): ForumCategory => ({
  slug,
  name,
  description,
  groupSlug,
  groupName,
  discussions: 0,
  posts: 0,
  latestActivity: "—",
});

export const forumCategoryGroups: ForumCategoryGroup[] = [
  {
    slug: "investing",
    name: "Investing",
    categories: [
      category(
        "investing",
        "Investing",
        "stocks",
        "Stocks",
        "Individual dividend companies, quality metrics and durable payout models.",
      ),
      category(
        "investing",
        "Investing",
        "etfs",
        "ETFs",
        "Dividend ETFs, fund construction, fees and income consistency.",
      ),
      category(
        "investing",
        "Investing",
        "funds",
        "Funds",
        "Income funds, active strategies and long-term allocation trade-offs.",
      ),
      category(
        "investing",
        "Investing",
        "reits",
        "REITs",
        "Real estate income, payout safety, leverage and sector-specific risks.",
      ),
      category(
        "investing",
        "Investing",
        "preferred-shares",
        "Preferred Shares",
        "Yield, call risk and portfolio role for preferred share instruments.",
      ),
    ],
  },
  {
    slug: "portfolios",
    name: "Portfolios",
    categories: [
      category(
        "portfolios",
        "Portfolios",
        "portfolio-reviews",
        "Portfolio Reviews",
        "Structured feedback for long-term income portfolios.",
      ),
      category(
        "portfolios",
        "Portfolios",
        "passive-income",
        "Passive Income",
        "Monthly income planning, milestones and long-term cash flow.",
      ),
      category(
        "portfolios",
        "Portfolios",
        "dividend-goals",
        "Dividend Goals",
        "Goal setting, payout milestones and durable income targets.",
      ),
      category(
        "portfolios",
        "Portfolios",
        "fire",
        "FIRE",
        "Financial independence through disciplined dividend income.",
      ),
    ],
  },
  {
    slug: "learning",
    name: "Learning",
    categories: [
      category(
        "learning",
        "Learning",
        "beginners",
        "Beginners",
        "A calm place for early dividend investors to ask better questions.",
      ),
      category(
        "learning",
        "Learning",
        "taxes",
        "Taxes",
        "Dividend taxation, account types and cross-border considerations.",
      ),
      category(
        "learning",
        "Learning",
        "dividend-strategy",
        "Dividend Strategy",
        "Payout coverage, growth, valuation and long-term strategy.",
      ),
      category(
        "learning",
        "Learning",
        "portfolio-psychology",
        "Portfolio Psychology",
        "Discipline, patience and avoiding emotional market noise.",
      ),
    ],
  },
  {
    slug: "dividend-brain",
    name: "Dividend Brain",
    categories: [
      category(
        "dividend-brain",
        "Dividend Brain",
        "ai-discussions",
        "AI Discussions",
        "How AI can explain portfolio patterns without giving advice.",
      ),
      category(
        "dividend-brain",
        "Dividend Brain",
        "portfolio-analysis",
        "Portfolio Analysis",
        "AI-assisted questions about income risk and diversification.",
      ),
      category(
        "dividend-brain",
        "Dividend Brain",
        "feature-requests",
        "Feature Requests",
        "Thoughtful suggestions for future Dividend Brain capabilities.",
      ),
    ],
  },
  {
    slug: "community",
    name: "Community",
    categories: [
      category(
        "community",
        "Community",
        "introductions",
        "Introductions",
        "New members, investor background and long-term goals.",
      ),
      category(
        "community",
        "Community",
        "feedback",
        "Feedback",
        "Product and forum feedback from Dividend Lab members.",
      ),
      category(
        "community",
        "Community",
        "off-topic",
        "Off Topic",
        "Thoughtful off-topic discussion for Dividend Lab members.",
      ),
    ],
  },
];

export const forumCategories: ForumCategory[] = forumCategoryGroups.flatMap(
  (group) => group.categories,
);

export const forumThreads: ForumThread[] = [];

export const featuredThread = null;

export const trendingThreads: ForumThread[] = [];

export const latestReplies: Array<{
  threadTitle: string;
  user: string;
  activity: string;
}> = [];

export const mostHelpfulMembers: ForumHelpfulMember[] = [];

export const forumPostsByThread: Record<string, ForumPost[]> = {};

export function isForumDemoThread(slug: string) {
  return slug === FORUM_DEMO_THREAD_SLUG;
}

export function getForumThread(slug: string) {
  if (isForumDemoThread(slug)) {
    return forumDemoThread;
  }

  return forumThreads.find((thread) => thread.slug === slug) ?? null;
}

export function getForumPosts(slug: string) {
  if (isForumDemoThread(slug)) {
    return forumDemoPosts;
  }

  return forumPostsByThread[slug] ?? [];
}

export function getForumCategory(slug: string) {
  return (
    forumCategories.find((category) => category.slug === slug) ??
    forumCategories[0]
  );
}

export function getForumThreadCategory(thread: ForumThread) {
  return getForumCategory(thread.categorySlug);
}

export { FORUM_DEMO_THREAD_SLUG } from "@/data/forum-demo";
