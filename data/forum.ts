import type {
  ForumCategory,
  ForumCategoryGroup,
  ForumHelpfulMember,
  ForumPost,
  ForumReaction,
  ForumThread,
} from "@/types/forum";

const baseReactions: ForumReaction[] = [
  { icon: "👍", label: "Helpful", count: 24 },
  { icon: "💡", label: "Insightful", count: 18 },
  { icon: "📊", label: "Well Researched", count: 12 },
  { icon: "🎯", label: "Practical", count: 7 },
  { icon: "📚", label: "Educational", count: 5 },
];

const category = (
  groupSlug: string,
  groupName: string,
  slug: string,
  name: string,
  description: string,
  discussions: number,
  posts: number,
  latestActivity: string,
): ForumCategory => ({
  slug,
  name,
  description,
  groupSlug,
  groupName,
  discussions,
  posts,
  latestActivity,
});

export const forumCategoryGroups: ForumCategoryGroup[] = [
  {
    slug: "investing",
    name: "Investing",
    categories: [
      category("investing", "Investing", "stocks", "Stocks", "Individual dividend companies, quality metrics and durable payout models.", 312, 4288, "4 min ago"),
      category("investing", "Investing", "etfs", "ETFs", "Dividend ETFs, fund construction, fees and income consistency.", 189, 2244, "35 min ago"),
      category("investing", "Investing", "funds", "Funds", "Income funds, active strategies and long-term allocation trade-offs.", 58, 642, "2 h ago"),
      category("investing", "Investing", "reits", "REITs", "Real estate income, payout safety, leverage and sector-specific risks.", 134, 1768, "21 min ago"),
      category("investing", "Investing", "preferred-shares", "Preferred Shares", "Yield, call risk and portfolio role for preferred share instruments.", 61, 592, "1 h ago"),
    ],
  },
  {
    slug: "portfolios",
    name: "Portfolios",
    categories: [
      category("portfolios", "Portfolios", "portfolio-reviews", "Portfolio Reviews", "Structured feedback for long-term income portfolios.", 97, 1430, "14 min ago"),
      category("portfolios", "Portfolios", "passive-income", "Passive Income", "Monthly income planning, milestones and long-term cash flow.", 116, 1612, "34 min ago"),
      category("portfolios", "Portfolios", "dividend-goals", "Dividend Goals", "Goal setting, payout milestones and durable income targets.", 88, 1210, "24 min ago"),
      category("portfolios", "Portfolios", "fire", "FIRE", "Financial independence through disciplined dividend income.", 64, 844, "44 min ago"),
    ],
  },
  {
    slug: "learning",
    name: "Learning",
    categories: [
      category("learning", "Learning", "beginners", "Beginners", "A calm place for early dividend investors to ask better questions.", 55, 612, "1 h ago"),
      category("learning", "Learning", "taxes", "Taxes", "Dividend taxation, account types and cross-border considerations.", 82, 905, "2 h ago"),
      category("learning", "Learning", "dividend-strategy", "Dividend Strategy", "Payout coverage, growth, valuation and long-term strategy.", 143, 1884, "8 min ago"),
      category("learning", "Learning", "portfolio-psychology", "Portfolio Psychology", "Discipline, patience and avoiding emotional market noise.", 42, 388, "3 h ago"),
    ],
  },
  {
    slug: "dividend-brain",
    name: "Dividend Brain",
    categories: [
      category("dividend-brain", "Dividend Brain", "ai-discussions", "AI Discussions", "How AI can explain portfolio patterns without giving advice.", 42, 386, "27 min ago"),
      category("dividend-brain", "Dividend Brain", "portfolio-analysis", "Portfolio Analysis", "AI-assisted questions about income risk and diversification.", 39, 344, "1 h ago"),
      category("dividend-brain", "Dividend Brain", "feature-requests", "Feature Requests", "Thoughtful suggestions for future Dividend Brain capabilities.", 26, 211, "5 h ago"),
    ],
  },
  {
    slug: "community",
    name: "Community",
    categories: [
      category("community", "Community", "introductions", "Introductions", "New members, investor background and long-term goals.", 44, 350, "11 min ago"),
      category("community", "Community", "feedback", "Feedback", "Product and forum feedback from Dividend Lab members.", 33, 278, "2 h ago"),
      category("community", "Community", "off-topic", "Off Topic", "Thoughtful off-topic discussion for Dividend Lab members.", 73, 821, "2 h ago"),
    ],
  },
];

export const forumCategories: ForumCategory[] = forumCategoryGroups.flatMap(
  (group) => group.categories,
);

export const forumThreads: ForumThread[] = [
  {
    slug: "building-a-portfolio-that-survives-dividend-cuts",
    title: "Building a portfolio that survives dividend cuts",
    categorySlug: "dividend-strategy",
    category: "Dividend Strategy",
    groupSlug: "learning",
    group: "Learning",
    author: "NordicIncome",
    replies: 48,
    views: 1840,
    lastActivity: "5 min ago",
    tags: ["risk", "payout safety", "diversification"],
    instruments: ["Stocks"],
    tickers: ["JNJ", "KO", "PG"],
    qualityScore: 94,
    recognitionCount: 66,
    sticky: true,
    excerpt:
      "A practical framework for reducing dependency on any single company, sector or payout cycle.",
  },
  {
    slug: "how-do-you-evaluate-reit-debt-maturity-walls",
    title: "How do you evaluate REIT debt maturity walls?",
    categorySlug: "reits",
    category: "REITs",
    groupSlug: "investing",
    group: "Investing",
    author: "CashflowAtlas",
    replies: 31,
    views: 920,
    lastActivity: "18 min ago",
    tags: ["debt", "real estate", "coverage"],
    instruments: ["REITs"],
    tickers: ["O", "PLD"],
    qualityScore: 88,
    recognitionCount: 41,
    excerpt:
      "Looking beyond headline yield when refinancing costs change the payout profile.",
  },
  {
    slug: "monthly-dividend-income-milestones-2026",
    title: "Monthly dividend income milestones for 2026",
    categorySlug: "passive-income",
    category: "Passive Income",
    groupSlug: "portfolios",
    group: "Portfolios",
    author: "LongHorizon",
    replies: 86,
    views: 2740,
    lastActivity: "34 min ago",
    tags: ["income", "milestones", "monthly cash flow"],
    instruments: ["Stocks", "ETFs"],
    qualityScore: 91,
    recognitionCount: 74,
    sticky: true,
    excerpt:
      "Members share income targets, contribution plans and how they track progress without chasing yield.",
  },
  {
    slug: "withholding-tax-lessons-for-nordic-investors",
    title: "Withholding tax lessons for Nordic investors",
    categorySlug: "taxes",
    category: "Taxes",
    groupSlug: "learning",
    group: "Learning",
    author: "TaxEfficient",
    replies: 22,
    views: 731,
    lastActivity: "1 h ago",
    tags: ["withholding tax", "accounts", "nordic investors"],
    instruments: ["Stocks", "ETFs"],
    qualityScore: 82,
    recognitionCount: 29,
    excerpt:
      "A calm discussion about account structure, paperwork and avoiding unnecessary drag.",
  },
  {
    slug: "does-dividend-growth-matter-more-than-starting-yield",
    title: "Does dividend growth matter more than starting yield?",
    categorySlug: "dividend-strategy",
    category: "Dividend Strategy",
    groupSlug: "learning",
    group: "Learning",
    author: "QualityFirst",
    replies: 63,
    views: 2104,
    lastActivity: "2 h ago",
    tags: ["yield", "growth", "valuation"],
    instruments: ["Stocks", "ETFs"],
    tickers: ["SCHD", "VYM"],
    qualityScore: 90,
    recognitionCount: 57,
    excerpt:
      "Comparing income today with income durability over ten years.",
  },
  {
    slug: "using-dividend-brain-to-find-portfolio-concentration",
    title: "Using Dividend Brain to find portfolio concentration",
    categorySlug: "ai-discussions",
    category: "AI Discussions",
    groupSlug: "dividend-brain",
    group: "Dividend Brain",
    author: "DataDividend",
    replies: 17,
    views: 508,
    lastActivity: "3 h ago",
    tags: ["ai", "concentration", "portfolio risk"],
    instruments: ["Dividend Brain"],
    qualityScore: 84,
    recognitionCount: 32,
    excerpt:
      "Future ideas for AI-assisted portfolio explanation and discussion recommendations.",
  },
  {
    slug: "vanguard-high-dividend-etf-vs-schd-for-europeans",
    title: "Vanguard High Dividend ETF vs SCHD for European investors",
    categorySlug: "etfs",
    category: "ETFs",
    groupSlug: "investing",
    group: "Investing",
    author: "ETFResearcher",
    replies: 54,
    views: 1938,
    lastActivity: "12 min ago",
    tags: ["ETF comparison", "withholding tax", "fund construction"],
    instruments: ["ETFs"],
    tickers: ["VYM", "SCHD"],
    qualityScore: 93,
    recognitionCount: 69,
    sticky: true,
    excerpt:
      "Comparing yield, dividend growth, tax drag and fund construction for long-term income portfolios.",
  },
  {
    slug: "screening-swedish-dividend-companies-without-chasing-yield",
    title: "Screening Swedish dividend companies without chasing yield",
    categorySlug: "stocks",
    category: "Stocks",
    groupSlug: "investing",
    group: "Investing",
    author: "StockholmYield",
    replies: 29,
    views: 884,
    lastActivity: "16 min ago",
    tags: ["screening", "quality", "sweden"],
    instruments: ["Stocks"],
    tickers: ["INVE-B", "ASSA-B"],
    qualityScore: 86,
    recognitionCount: 38,
    excerpt:
      "A checklist for quality, balance sheets and payout consistency in the Swedish market.",
  },
  {
    slug: "what-does-a-healthy-income-portfolio-look-like",
    title: "What does a healthy income portfolio look like?",
    categorySlug: "portfolio-reviews",
    category: "Portfolio Reviews",
    groupSlug: "portfolios",
    group: "Portfolios",
    author: "BalanceSheetNerd",
    replies: 41,
    views: 1322,
    lastActivity: "44 min ago",
    tags: ["portfolio review", "concentration", "income resilience"],
    instruments: ["Stocks", "REITs", "ETFs"],
    qualityScore: 87,
    recognitionCount: 46,
    excerpt:
      "Members compare concentration, payout coverage and dependency on individual dividend dates.",
  },
  {
    slug: "new-member-building-first-1000-sek-month",
    title: "New member: building toward the first 1,000 SEK per month",
    categorySlug: "introductions",
    category: "Introductions",
    groupSlug: "community",
    group: "Community",
    author: "FirstDividend",
    replies: 18,
    views: 410,
    lastActivity: "11 min ago",
    tags: ["beginner", "monthly income", "introduction"],
    instruments: ["Stocks", "ETFs"],
    qualityScore: 76,
    recognitionCount: 21,
    excerpt:
      "A long-term investor introduces a simple monthly contribution plan and asks for learning resources.",
  },
  {
    slug: "interest-rates-and-dividend-safety-in-2026",
    title: "Interest rates and dividend safety in 2026",
    categorySlug: "dividend-strategy",
    category: "Dividend Strategy",
    groupSlug: "learning",
    group: "Learning",
    author: "MacroIncome",
    replies: 36,
    views: 1148,
    lastActivity: "9 h ago",
    tags: ["rates", "coverage", "strategy"],
    instruments: ["Stocks", "REITs"],
    qualityScore: 81,
    recognitionCount: 35,
    excerpt:
      "How higher refinancing costs can affect payout coverage without turning the forum into market timing.",
  },
  {
    slug: "request-dividend-brain-thread-summaries",
    title: "Feature request: Dividend Brain summaries for long threads",
    categorySlug: "feature-requests",
    category: "Feature Requests",
    groupSlug: "dividend-brain",
    group: "Dividend Brain",
    author: "SignalOverNoise",
    replies: 12,
    views: 306,
    lastActivity: "5 h ago",
    tags: ["thread summaries", "feature request", "ai"],
    instruments: ["Dividend Brain"],
    qualityScore: 79,
    recognitionCount: 18,
    excerpt:
      "A proposal for AI-generated educational summaries that preserve user judgment.",
  },
];

export const featuredThread = forumThreads[0];

export const trendingThreads = [
  forumThreads[2],
  forumThreads[4],
  forumThreads[1],
];

export const latestReplies = [
  {
    threadTitle: "Building a portfolio that survives dividend cuts",
    user: "DividendEngineer",
    activity: "5 min ago",
  },
  {
    threadTitle: "How do you evaluate REIT debt maturity walls?",
    user: "BalanceSheetNerd",
    activity: "18 min ago",
  },
  {
    threadTitle: "Using Dividend Brain to find portfolio concentration",
    user: "DataDividend",
    activity: "27 min ago",
  },
];

export const mostHelpfulMembers: ForumHelpfulMember[] = [
  {
    username: "DividendEngineer",
    recognition: 142,
    specialty: "Payout safety",
  },
  {
    username: "QualityFirst",
    recognition: 118,
    specialty: "Dividend growth",
  },
  {
    username: "ETFResearcher",
    recognition: 96,
    specialty: "ETF structure",
  },
];

export const forumPostsByThread: Record<string, ForumPost[]> = {
  "building-a-portfolio-that-survives-dividend-cuts": [
    {
      id: "post-1",
      username: "NordicIncome",
      avatar: "NI",
      memberSince: "Member since 2024",
      joinDate: "Joined Feb 2024",
      timestamp: "Today at 08:42",
      content:
        "I have started thinking about dividend safety less as a company-by-company question and more as a portfolio construction question. A single cut should not change the direction of the plan. Sector exposure, payout calendars, currency mix and position sizing matter more than I used to admit.",
      reactions: baseReactions,
    },
    {
      id: "post-2",
      username: "DividendEngineer",
      avatar: "DE",
      memberSince: "Member since 2023",
      joinDate: "Joined Nov 2023",
      timestamp: "Today at 09:16",
      content:
        "The most useful rule for me has been to separate income reliability from yield. A 6% yield with fragile coverage is not more useful than a 3% yield that grows through cycles. I now score each holding by payout coverage, balance sheet trend and cyclicality before looking at yield.",
      reactions: [
        { icon: "👍", label: "Helpful", count: 31 },
        { icon: "💡", label: "Insightful", count: 22 },
        { icon: "📊", label: "Well Researched", count: 16 },
        { icon: "🎯", label: "Practical", count: 14 },
        { icon: "📚", label: "Educational", count: 9 },
      ],
    },
    {
      id: "post-3",
      username: "QualityFirst",
      avatar: "QF",
      memberSince: "Member since 2025",
      joinDate: "Joined Jan 2025",
      timestamp: "Today at 10:04",
      content:
        "This is where Dividend Brain could become useful later. If it can flag that 40% of forward dividend income depends on two sectors, that gives users a better question to ask without telling them what to buy or sell.",
      reactions: [
        { icon: "👍", label: "Helpful", count: 19 },
        { icon: "💡", label: "Insightful", count: 28 },
        { icon: "📊", label: "Well Researched", count: 8 },
        { icon: "🎯", label: "Practical", count: 11 },
        { icon: "📚", label: "Educational", count: 12 },
      ],
    },
  ],
};

export function getForumThread(slug: string) {
  return forumThreads.find((thread) => thread.slug === slug) ?? forumThreads[0];
}

export function getForumPosts(slug: string) {
  return forumPostsByThread[slug] ?? forumPostsByThread[forumThreads[0].slug];
}

export function getForumCategory(slug: string) {
  return forumCategories.find((category) => category.slug === slug) ?? forumCategories[0];
}

export function getForumThreadCategory(thread: ForumThread) {
  return getForumCategory(thread.categorySlug);
}
