import type { ForumPost, ForumThread } from "@/types/forum";

/** Isolated demo content for manual UI testing — not real community activity. */
export const FORUM_DEMO_THREAD_SLUG = "demo-interactions-preview";

export const forumDemoThread: ForumThread = {
  slug: FORUM_DEMO_THREAD_SLUG,
  title: "Development preview: forum interactions",
  categorySlug: "beginners",
  category: "Beginners",
  groupSlug: "learning",
  group: "Learning",
  author: "@demo-preview",
  replies: 0,
  lastActivity: "Preview",
  tags: ["development", "preview"],
  excerpt:
    "Sample thread for testing profile links, messages, quotes, and action menus. Not real member content.",
};

export const forumDemoPosts: ForumPost[] = [
  {
    id: "demo-post-1",
    username: "demo-preview",
    avatar: "DP",
    memberSince: "Development preview",
    joinDate: "Preview content",
    timestamp: "Preview",
    content:
      "This is sample content for testing forum user interactions. Use the @username link, hover menu, or mobile ⋯ menu to try Profile, Message, and Quote.",
    reactions: [],
  },
];
