import type { Metadata } from "next";
import ForumCategoryThreadsPage from "@/components/forum/ForumCategoryThreadsPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import { forumCategories } from "@/data/forum";
import { isForumCategorySlug } from "@/lib/forum/queries";
import { getForumPageContext } from "@/lib/forum/page-data";
import { buildForumMetadata } from "@/lib/seo/forum-metadata";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = forumCategories.find((item) => item.slug === slug);

  if (!category) {
    return {};
  }

  return buildForumMetadata({
    title: `${category.name} – Forum`,
    description: category.description,
    path: `/forum/kategorier/${category.slug}`,
  });
}

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
