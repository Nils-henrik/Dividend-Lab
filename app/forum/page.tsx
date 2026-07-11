import ForumVisitTracker from "@/components/dashboard/ForumVisitTracker";
import ForumOverviewPage from "@/components/forum/ForumOverviewPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  buildForumCategoryCounts,
  getForumCategoriesWithCounts,
  getForumPopularThreads,
  getForumThreadsFromDatabase,
  isForumCategorySlug,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ForumPage({ searchParams }: Props) {
  const { category } = await searchParams;

  if (category && isForumCategorySlug(category)) {
    redirect(`/forum/kategorier/${category}`);
  }

  const user = await getAuthenticatedUser();
  const [allRecords, popularRecords] = await Promise.all([
    getForumThreadsFromDatabase(),
    getForumPopularThreads(5),
  ]);
  const categoryCounts = buildForumCategoryCounts(allRecords);
  const categoryGroups = getForumCategoriesWithCounts(categoryCounts);
  const threads = allRecords.map(mapThreadRecordToForumThread);
  const latestRecords = [...allRecords]
    .sort(
      (first, second) =>
        new Date(second.lastActivityAt ?? second.createdAt).getTime() -
        new Date(first.lastActivityAt ?? first.createdAt).getTime(),
    )
    .slice(0, 5);
  const latestThreads = latestRecords.map(mapThreadRecordToForumThread);
  const popularThreads = popularRecords.map(mapThreadRecordToForumThread);

  return (
    <ForumRouteShell user={user}>
      <ForumVisitTracker />
      <ForumOverviewPage
        isAuthenticated={Boolean(user)}
        latestThreads={latestThreads}
        popularThreads={popularThreads}
        allThreads={threads}
        categoryGroups={categoryGroups}
      />
    </ForumRouteShell>
  );
}
