import ForumHomePage from "@/components/forum/ForumHomePage";
import {
  buildForumCategoryCounts,
  getForumCategoriesWithCounts,
  getForumThreadsFromDatabase,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";

export default async function ForumPage() {
  const threadRecords = await getForumThreadsFromDatabase();
  const threads = threadRecords.map(mapThreadRecordToForumThread);
  const categoryCounts = buildForumCategoryCounts(threadRecords);
  const categoryGroups = getForumCategoriesWithCounts(categoryCounts);

  return (
    <ForumHomePage
      isAuthenticated
      threads={threads}
      categoryGroups={categoryGroups}
    />
  );
}
