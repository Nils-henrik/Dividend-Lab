import ForumCategoriesIndexPage from "@/components/forum/ForumCategoriesIndexPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import { getForumPageContext } from "@/lib/forum/page-data";

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
