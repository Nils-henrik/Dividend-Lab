import type { Metadata } from "next";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import ForumThreadFeedPage from "@/components/forum/ForumThreadFeedPage";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getForumPopularThreads,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";
import { buildForumMetadata } from "@/lib/seo/forum-metadata";

export const metadata: Metadata = buildForumMetadata({
  title: "Populärt i forumet",
  description:
    "Populära diskussioner i DivLabs forum från de senaste 30 dagarna.",
  path: "/forum/populart",
});

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
