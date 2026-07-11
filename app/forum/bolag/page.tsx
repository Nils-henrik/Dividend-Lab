import ForumBolagPlaceholderPage from "@/components/forum/ForumBolagPlaceholderPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function ForumBolagPage() {
  const user = await getAuthenticatedUser();

  return (
    <ForumRouteShell user={user}>
      <ForumBolagPlaceholderPage />
    </ForumRouteShell>
  );
}
