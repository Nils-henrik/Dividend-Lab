import type { Metadata } from "next";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import ForumThreadFeedPage from "@/components/forum/ForumThreadFeedPage";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getForumThreadsByLatestActivity,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";
import { buildForumMetadata } from "@/lib/seo/forum-metadata";

export const metadata: Metadata = buildForumMetadata({
  title: "Senaste i forumet",
  description:
    "Senaste diskussionerna i DivLabs forum, sorterade efter aktivitet.",
  path: "/forum/senaste",
});

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
