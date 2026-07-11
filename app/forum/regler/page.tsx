import ForumRouteShell from "@/components/forum/ForumRouteShell";
import ForumWelcomePage from "@/components/forum/ForumWelcomePage";
import { getForumPageContext } from "@/lib/forum/page-data";

export default async function ForumRulesPage() {
  const { user, categoryGroups } = await getForumPageContext();

  return (
    <ForumRouteShell user={user}>
      <ForumWelcomePage
        categoryGroups={categoryGroups}
        isAuthenticated={Boolean(user)}
      />
    </ForumRouteShell>
  );
}
