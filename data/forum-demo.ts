import type { ForumPost, ForumThread } from "@/types/forum";

/** Isolated demo content for manual UI testing — not real community activity. */
export const FORUM_DEMO_THREAD_SLUG = "demo-interactions-preview";

export const forumDemoThread: ForumThread = {
  slug: FORUM_DEMO_THREAD_SLUG,
  title: "Förhandsvisning: foruminteraktioner",
  categorySlug: "beginners",
  category: "Beginners",
  groupSlug: "learning",
  group: "Learning",
  author: "@demo-preview",
  replies: 0,
  lastActivity: "Förhandsvisning",
  tags: ["development", "preview"],
  excerpt:
    "Exempeltråd för att testa profillänkar, meddelanden, citat och åtgärdsmenyer. Inte riktigt medlemsinnehåll.",
};

export const forumDemoPosts: ForumPost[] = [
  {
    id: "demo-post-1",
    username: "demo-preview",
    avatar: "DP",
    memberSince: "Förhandsvisning",
    joinDate: "Förhandsinnehåll",
    timestamp: "Förhandsvisning",
    content:
      "Detta är exempelinnehåll för att testa foruminteraktioner. Använd @användarnamn-länken, hovringsmenyn eller mobilmenyn ⋯ för att prova Profil, Meddelande och Citera.",
    reactions: [],
  },
];
