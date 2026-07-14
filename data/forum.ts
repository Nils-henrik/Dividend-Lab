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
    name: "Investering",
    categories: [
      category(
        "investing",
        "Investering",
        "stocks",
        "Aktier",
        "Enskilda utdelningsbolag, kvalitetsmått och hållbara utdelningsmodeller.",
      ),
      category(
        "investing",
        "Investering",
        "etfs",
        "ETF:er",
        "Utdelnings-ETF:er, fondsammansättning, avgifter och inkomstkonsistens.",
      ),
      category(
        "investing",
        "Investering",
        "funds",
        "Fonder",
        "Inkomstfonder, aktiva strategier och långsiktiga allokeringsavvägningar.",
      ),
      category(
        "investing",
        "Investering",
        "reits",
        "Fastighetsbolag (REIT)",
        "Fastighetsinkomst, utdelningssäkerhet, skuldsättning och sektorsrisker.",
      ),
      category(
        "investing",
        "Investering",
        "preferred-shares",
        "Preferensaktier",
        "Avkastning, inlösenrisk och rollen i portföljen.",
      ),
    ],
  },
  {
    slug: "portfolios",
    name: "Portföljer",
    categories: [
      category(
        "portfolios",
        "Portföljer",
        "portfolio-reviews",
        "Portföljgranskningar",
        "Strukturerad feedback för långsiktiga inkomstportföljer.",
      ),
      category(
        "portfolios",
        "Portföljer",
        "passive-income",
        "Passiv inkomst",
        "Månadsinkomst, milstolpar och långsiktigt kassaflöde.",
      ),
      category(
        "portfolios",
        "Portföljer",
        "dividend-goals",
        "Utdelningsmål",
        "Målformulering, utbetalningsmilstolpar och hållbara inkomstmål.",
      ),
      category(
        "portfolios",
        "Portföljer",
        "fire",
        "FIRE",
        "Ekonomisk frihet genom disciplinerad utdelningsinkomst.",
      ),
    ],
  },
  {
    slug: "learning",
    name: "Utbildning",
    categories: [
      category(
        "learning",
        "Utbildning",
        "beginners",
        "Nybörjare",
        "En lugn plats för nya utdelningsinvesterare att ställa bättre frågor.",
      ),
      category(
        "learning",
        "Utbildning",
        "taxes",
        "Skatt",
        "Utdelningsskatt, kontotyper och gränsöverskridande aspekter.",
      ),
      category(
        "learning",
        "Utbildning",
        "dividend-strategy",
        "Utdelningsstrategi",
        "Utdelningstäckning, tillväxt, värdering och långsiktig strategi.",
      ),
      category(
        "learning",
        "Utbildning",
        "portfolio-psychology",
        "Portföljpsykologi",
        "Disciplin, tålamod och att undvika emotionellt marknadsbrus.",
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
        "AI-diskussioner",
        "Hur AI kan förklara portföljmönster utan att ge råd.",
      ),
      category(
        "dividend-brain",
        "Dividend Brain",
        "portfolio-analysis",
        "Portföljanalys",
        "AI-stödda frågor om inkomstrisk och diversifiering.",
      ),
      category(
        "dividend-brain",
        "Dividend Brain",
        "feature-requests",
        "Funktionsförslag",
        "Genomtänkta förslag för framtida Dividend Brain-funktioner.",
      ),
    ],
  },
  {
    slug: "community",
    name: "Gemenskap",
    categories: [
      category(
        "community",
        "Gemenskap",
        "introductions",
        "Presentationer",
        "Nya medlemmar, investerarbakgrund och långsiktiga mål.",
      ),
      category(
        "community",
        "Gemenskap",
        "feedback",
        "Feedback",
        "Produkt- och forumfeedback från DivLab-medlemmar.",
      ),
      category(
        "community",
        "Gemenskap",
        "off-topic",
        "Off topic",
        "Genomtänkta off topic-diskussioner för DivLab-medlemmar.",
      ),
    ],
  },
  {
    slug: "divlab",
    name: "DivLab",
    categories: [
      category(
        "divlab",
        "DivLab",
        "divlab-improvements",
        "DivLab förbättringar",
        "Förslag, feedback och idéer för hur DivLab kan bli bättre.",
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
