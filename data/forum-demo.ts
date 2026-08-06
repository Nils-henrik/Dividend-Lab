import type { ForumPost, ForumThread } from "@/types/forum";

/**
 * Isolated development fixture for forum UI testing.
 * Not listed in public forum feeds — only reachable by direct URL.
 */
export const FORUM_DEMO_THREAD_SLUG = "demo-interactions-preview";

export const forumDemoThread: ForumThread = {
  slug: FORUM_DEMO_THREAD_SLUG,
  title: "[Utveckling] Foruminteraktioner — internt testinnehåll",
  categorySlug: "beginners",
  category: "Nybörjare",
  groupSlug: "learning",
  group: "Utbildning",
  author: "@divlab-test",
  replies: 0,
  lastActivity: "Internt testinnehåll",
  tags: ["utveckling", "test"],
  excerpt:
    "Internt testinnehåll för att verifiera forumfunktioner. Detta är inte riktigt medlemsinnehåll och tillhör inte community-diskussionerna.",
};

export const forumDemoPosts: ForumPost[] = [
  {
    id: "demo-post-1",
    username: "divlab-test",
    avatar: "DT",
    memberSince: "Internt testinnehåll",
    joinDate: "Internt testinnehåll",
    timestamp: "Internt testinnehåll",
    content:
      "Detta är internt testinnehåll för att verifiera foruminteraktioner. Det är inte riktigt medlemsinnehåll och ska inte tolkas som community-aktivitet.",
    reactions: [],
  },
];
