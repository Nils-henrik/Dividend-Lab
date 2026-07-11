import ForumRouteShell from "@/components/forum/ForumRouteShell";
import ForumThreadFeedPage from "@/components/forum/ForumThreadFeedPage";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getForumPopularThreads,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";

export default async function ForumPopularPage() {
  const user = await getAuthenticatedUser();
  const popularRecords = await getForumPopularThreads();
  const threads = popularRecords.map(mapThreadRecordToForumThread);

  return (
    <ForumRouteShell user={user}>
      <ForumThreadFeedPage
        title="Populärt"
        breadcrumbLabel="Populärt"
        description="Aktiva diskussioner från de senaste 30 dagarna, rankade efter engagemang."
        threads={threads}
        isAuthenticated={Boolean(user)}
      />
    </ForumRouteShell>
  );
}
