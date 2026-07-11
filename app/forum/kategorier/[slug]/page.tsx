import ForumCategoryThreadsPage from "@/components/forum/ForumCategoryThreadsPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import { isForumCategorySlug } from "@/lib/forum/queries";
import { getForumPageContext } from "@/lib/forum/page-data";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ForumCategoryPage({ params }: Props) {
  const { slug } = await params;

  if (!isForumCategorySlug(slug)) {
    notFound();
  }

  const { user, threads, categoryGroups } = await getForumPageContext();

  return (
    <ForumRouteShell user={user}>
      <ForumCategoryThreadsPage
        categorySlug={slug}
        isAuthenticated={Boolean(user)}
        threads={threads}
        categoryGroups={categoryGroups}
      />
    </ForumRouteShell>
  );
}
