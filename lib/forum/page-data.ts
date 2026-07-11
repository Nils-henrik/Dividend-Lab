import { getAuthenticatedUser } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/auth/user";
import {
  buildForumCategoryCounts,
  getForumCategoriesWithCounts,
  getForumThreadsFromDatabase,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";
import type { ForumCategoryGroup, ForumThread } from "@/types/forum";

export type ForumPageContext = {
  user: AuthenticatedUser | null;
  threads: ForumThread[];
  categoryGroups: ForumCategoryGroup[];
};

export async function getForumPageContext(): Promise<ForumPageContext> {
  const user = await getAuthenticatedUser();
  const threadRecords = await getForumThreadsFromDatabase();
  const threads = threadRecords.map(mapThreadRecordToForumThread);
  const categoryCounts = buildForumCategoryCounts(threadRecords);
  const categoryGroups = getForumCategoriesWithCounts(categoryCounts);

  return {
    user,
    threads,
    categoryGroups,
  };
}
