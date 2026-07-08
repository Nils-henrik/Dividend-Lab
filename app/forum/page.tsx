import ForumHomePage from "@/components/forum/ForumHomePage";
import AppShell from "@/components/layout/AppShell";
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

  if (user) {
    return (
      <AppShell user={user}>
        <ForumHomePage
          initialCategorySlug={category}
          isAuthenticated
          threads={threads}
          categoryGroups={categoryGroups}
        />
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="px-8 py-8">
        <ForumHomePage
          initialCategorySlug={category}
          threads={threads}
          categoryGroups={categoryGroups}
        />
      </div>
    </main>
  );
}
