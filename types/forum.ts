export type ForumReaction = {
  label: "Helpful" | "Insightful" | "Well Researched" | "Practical" | "Educational";
  icon: string;
  count: number;
};

export type ForumCategoryGroup = {
  slug: string;
  name: string;
  categories: ForumCategory[];
};

export type ForumCategory = {
  slug: string;
  name: string;
  description: string;
  groupSlug: string;
  groupName: string;
  discussions: number;
  posts: number;
  latestActivity: string;
};

export type ForumThread = {
  slug: string;
  title: string;
  categorySlug: string;
  category: string;
  groupSlug: string;
  group: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
  excerpt: string;
  tags: string[];
  instruments?: string[];
  tickers?: string[];
  qualityScore: number;
  recognitionCount: number;
  sticky?: boolean;
};

export type ForumPost = {
  id: string;
  username: string;
  avatar: string;
  memberSince: string;
  joinDate: string;
  timestamp: string;
  content: string;
  reactions: ForumReaction[];
};

export type ForumHelpfulMember = {
  username: string;
  recognition: number;
  specialty: string;
};
