import Link from "next/link";
import type { ForumCategoryGroup } from "@/types/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumCategoryItem from "./ForumCategoryItem";
import ForumPageHeader from "./ForumPageHeader";
import ForumSubnav from "./ForumSubnav";

type Props = {
  categoryGroups: ForumCategoryGroup[];
  isAuthenticated?: boolean;
};

export default function ForumCategoriesIndexPage({
  categoryGroups,
  isAuthenticated = false,
}: Props) {
  const newDiscussionHref = "/forum/new";
  const loginHref = `/login?redirect=${encodeURIComponent(newDiscussionHref)}`;

  return (
    <div className="space-y-3">
      <ForumSubnav />

      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: "Kategorier" },
        ]}
      />

      <ForumPageHeader
        title="Kategorier"
        description="Välj ett område för att läsa eller starta diskussioner som inte är knutna till ett enskilt bolag."
        isAuthenticated={isAuthenticated}
        newDiscussionHref={newDiscussionHref}
        loginHref={loginHref}
        showCreateAction
      />

      <section className="divlab-surface-panel p-4">
        <div className="space-y-5">
          {categoryGroups.map((group) => (
            <div key={group.slug}>
              <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400">
                {group.name}
              </h2>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {group.categories.map((category) => (
                  <ForumCategoryItem
                    key={category.slug}
                    category={category}
                    isActive={false}
                    enhancedContrast
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-gray-600">
        <Link href="/forum" className="transition hover:text-gray-400">
          Tillbaka till forumöversikten
        </Link>
      </p>
    </div>
  );
}
