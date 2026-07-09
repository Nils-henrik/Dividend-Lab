import Link from "next/link";
import { redirect } from "next/navigation";
import NewDiscussionForm from "@/components/forum/NewDiscussionForm";
import ForumBreadcrumbs from "@/components/forum/ForumBreadcrumbs";
import AppShell from "@/components/layout/AppShell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { forumCategories, getForumCategory } from "@/data/forum";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

function getInitialCategorySlug(category?: string) {
  if (category && forumCategories.some((item) => item.slug === category)) {
    return category;
  }

  return forumCategories[0].slug;
}

export default async function NewForumDiscussionPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const user = await getAuthenticatedUser();
  const initialCategorySlug = getInitialCategorySlug(category);
  const activeCategory = getForumCategory(initialCategorySlug);
  const loginRedirect = `/login?redirect=${encodeURIComponent(
    `/forum/new?category=${initialCategorySlug}`,
  )}`;

  if (!user) {
    redirect(loginRedirect);
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-3xl space-y-4">
        <ForumBreadcrumbs
          items={[
            { label: "Forum", href: "/forum" },
            {
              label: activeCategory.name,
              href: `/forum?category=${activeCategory.slug}`,
            },
            { label: "Ny diskussion" },
          ]}
        />

        <section className="divlab-card rounded-3xl p-6">
          <p className="divlab-section-label">Starta diskussion</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-divlab-text">
            Ny diskussion i {activeCategory.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Dela en genomtänkt fråga eller insikt med Dividend Lab-gemenskapen.
          </p>

          <div className="mt-6">
            <NewDiscussionForm initialCategorySlug={initialCategorySlug} />
          </div>
        </section>

        <p className="text-center text-xs text-gray-600">
          <Link href="/forum" className="transition hover:text-gray-400">
            Tillbaka till forumet
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
