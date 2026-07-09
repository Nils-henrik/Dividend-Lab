import ForumVisitTracker from "@/components/dashboard/ForumVisitTracker";
import ForumHomePage from "@/components/forum/ForumHomePage";
import ForumWelcomePage from "@/components/forum/ForumWelcomePage";
import AppShell from "@/components/layout/AppShell";
import { forumCategories } from "@/data/forum";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  buildForumCategoryCounts,
  getForumCategoriesWithCounts,
  getForumThreadsFromDatabase,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ForumPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const user = await getAuthenticatedUser();
  const threadRecords = await getForumThreadsFromDatabase();
  const threads = threadRecords.map(mapThreadRecordToForumThread);
  const categoryCounts = buildForumCategoryCounts(threadRecords);
  const categoryGroups = getForumCategoriesWithCounts(categoryCounts);
  const hasCategoryFilter =
    Boolean(category) && forumCategories.some((item) => item.slug === category);

  if (user) {
    return (
      <AppShell user={user}>
        <ForumVisitTracker />
        {hasCategoryFilter ? (
          <ForumHomePage
            initialCategorySlug={category}
            isAuthenticated
            threads={threads}
            categoryGroups={categoryGroups}
          />
        ) : (
          <ForumWelcomePage
            isAuthenticated
            categoryGroups={categoryGroups}
          />
        )}
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-divlab-bg text-divlab-text">
      <div className="px-8 py-8">
        <ForumVisitTracker />
        {hasCategoryFilter ? (
          <ForumHomePage
            initialCategorySlug={category}
            threads={threads}
            categoryGroups={categoryGroups}
          />
        ) : (
          <ForumWelcomePage categoryGroups={categoryGroups} />
        )}
      </div>
    </main>
  );
}
