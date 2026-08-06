import type { Metadata } from "next";
import ForumCategoriesIndexPage from "@/components/forum/ForumCategoriesIndexPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import { getForumPageContext } from "@/lib/forum/page-data";
import { buildForumMetadata } from "@/lib/seo/forum-metadata";

export const metadata: Metadata = buildForumMetadata({
  title: "Forumkategorier",
  description: "Bläddra bland kategorier i DivLabs forum.",
  path: "/forum/kategorier",
});

export default async function ForumCategoriesPage() {
  const { user, categoryGroups } = await getForumPageContext();

  return (
    <ForumRouteShell user={user}>
      <ForumCategoriesIndexPage
        categoryGroups={categoryGroups}
        isAuthenticated={Boolean(user)}
      />
    </ForumRouteShell>
  );
}
