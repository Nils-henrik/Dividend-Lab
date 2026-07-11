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
  id?: string;
  slug: string;
  title: string;
  body?: string;
  categorySlug: string;
  category: string;
  groupSlug: string;
  group: string;
  author: string;
  authorUsername?: string | null;
  authorUserId?: string;
  authorAvatarUrl?: string | null;
  replies: number;
  lastActivity: string;
  createdAt?: string;
  excerpt: string;
  tags: string[];
  sticky?: boolean;
};

export type ForumPost = {
  id: string;
  username: string;
  displayName?: string | null;
  avatar: string;
  avatarUrl?: string | null;
  memberSince: string;
  joinDate: string;
  timestamp: string;
  content: string;
  reactions: ForumReaction[];
  authorUserId?: string;
};

export type ForumHelpfulMember = {
  username: string;
  recognition: number;
  specialty: string;
};
