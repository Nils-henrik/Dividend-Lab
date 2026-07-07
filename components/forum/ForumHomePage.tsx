"use client";

import { useMemo, useState } from "react";
import { forumCategories, forumThreads, getForumCategory } from "@/data/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumHeader from "./ForumHeader";
import ForumRightSidebar from "./ForumRightSidebar";
import ForumSidebar from "./ForumSidebar";
import ForumThreadCard from "./ForumThreadCard";
import ForumThreadList from "./ForumThreadList";

type Props = {
  initialCategorySlug?: string;
  isAuthenticated?: boolean;
};

export default function ForumHomePage({
  initialCategorySlug,
  isAuthenticated = false,
}: Props) {
  const [activeCategorySlug, setActiveCategorySlug] = useState(
    initialCategorySlug &&
      forumCategories.some((category) => category.slug === initialCategorySlug)
      ? initialCategorySlug
      : forumCategories[0].slug,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = getForumCategory(activeCategorySlug);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredThreads = useMemo(() => {
    return forumThreads.filter((thread) => {
      const matchesCategory = thread.categorySlug === activeCategorySlug;
      const searchableText = [
        thread.title,
        thread.excerpt,
        thread.author,
        thread.category,
        thread.group,
        ...thread.tags,
        ...(thread.instruments ?? []),
        ...(thread.tickers ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesCategory &&
        (normalizedSearch === "" || searchableText.includes(normalizedSearch))
      );
    });
  }, [activeCategorySlug, normalizedSearch]);

  const featuredThread =
    filteredThreads.find((thread) => thread.sticky) ?? filteredThreads[0];

  return (
    <div className="space-y-3">
      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: activeCategory.groupName },
          { label: activeCategory.name },
        ]}
      />

      <div className="grid gap-4 2xl:grid-cols-[230px_minmax(0,1fr)_290px]">
        <ForumSidebar
          activeCategorySlug={activeCategorySlug}
          onSelectCategory={(categorySlug) => {
            setActiveCategorySlug(categorySlug);
            setSearchQuery("");
          }}
        />

        <main className="space-y-3">
          <ForumHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategoryName={activeCategory.name}
            isAuthenticated={isAuthenticated}
          />

          <section className="rounded-lg border border-white/10 bg-[#111111]/85 p-3">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium text-white">
                  Featured Discussion
                </h2>
              </div>
            </div>

            {featuredThread ? (
              <ForumThreadCard thread={featuredThread} featured />
            ) : (
              <p className="rounded-lg border border-white/10 bg-[#161616] p-4 text-sm text-gray-500">
                No featured discussion matches this category and search yet.
              </p>
            )}
          </section>

          <ForumThreadList
            title={`${activeCategory.name} Discussions`}
            description={`${filteredThreads.length} active discussions in ${activeCategory.groupName}.`}
            threads={filteredThreads}
          />
        </main>

        <ForumRightSidebar />
      </div>
    </div>
  );
}
