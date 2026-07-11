import ForumRouteShell from "@/components/forum/ForumRouteShell";
import ForumThreadFeedPage from "@/components/forum/ForumThreadFeedPage";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getForumThreadsByLatestActivity,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";

export default async function ForumLatestPage() {
  const user = await getAuthenticatedUser();
  const latestRecords = await getForumThreadsByLatestActivity();
  const threads = latestRecords.map(mapThreadRecordToForumThread);

  return (
    <ForumRouteShell user={user}>
      <ForumThreadFeedPage
        title="Senaste"
        breadcrumbLabel="Senaste"
        description="Diskussioner sorterade efter senaste aktivitet i tråden."
        threads={threads}
        isAuthenticated={Boolean(user)}
      />
    </ForumRouteShell>
  );
}
