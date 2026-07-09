"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { forumCategories, getForumCategory } from "@/data/forum";
import type { ForumCategoryGroup, ForumThread } from "@/types/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumHeader from "./ForumHeader";
import ForumRightSidebar from "./ForumRightSidebar";
import ForumSidebar from "./ForumSidebar";
import ForumThreadCard from "./ForumThreadCard";
import ForumThreadList from "./ForumThreadList";

type Props = {
  initialCategorySlug?: string;
  isAuthenticated?: boolean;
  threads: ForumThread[];
  categoryGroups: ForumCategoryGroup[];
};

function getNewDiscussionHref(categorySlug: string) {
  return `/forum/new?category=${encodeURIComponent(categorySlug)}`;
}

function getLoginHref(categorySlug: string) {
  return `/login?redirect=${encodeURIComponent(getNewDiscussionHref(categorySlug))}`;
}

export default function ForumHomePage({
  initialCategorySlug,
  isAuthenticated = false,
  threads,
  categoryGroups,
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
  const newDiscussionHref = getNewDiscussionHref(activeCategorySlug);
  const loginHref = getLoginHref(activeCategorySlug);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesCategory = thread.categorySlug === activeCategorySlug;
      const searchableText = [
        thread.title,
        thread.excerpt,
        thread.author,
        thread.category,
        thread.group,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesCategory &&
        (normalizedSearch === "" || searchableText.includes(normalizedSearch))
      );
    });
  }, [activeCategorySlug, normalizedSearch, threads]);

  const featuredThread = filteredThreads[0] ?? null;

  return (
    <div className="space-y-3">
      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: activeCategory.name },
        ]}
      />

      <div className="grid gap-4 2xl:grid-cols-[230px_minmax(0,1fr)_290px]">
        <ForumSidebar
          activeCategorySlug={activeCategorySlug}
          categoryGroups={categoryGroups}
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
            newDiscussionHref={newDiscussionHref}
            loginHref={loginHref}
          />

          {filteredThreads.length === 0 ? (
            <section className="rounded-lg border border-white/10 bg-[#111111]/85 p-8 text-center">
              <p className="text-sm font-medium text-white">Inga diskussioner än</p>
              <p className="mt-2 text-sm text-gray-500">
                Starta den första diskussionen i {activeCategory.name}.
              </p>
              {isAuthenticated ? (
                <Link
                  href={newDiscussionHref}
                  className="mt-6 inline-flex rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Starta diskussion
                </Link>
              ) : (
                <Link
                  href={loginHref}
                  className="mt-6 inline-flex rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Logga in för att starta en diskussion
                </Link>
              )}
            </section>
          ) : (
            <>
              <section className="rounded-lg border border-white/10 bg-[#111111]/85 p-3">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-medium text-white">
                      Utvald diskussion
                    </h2>
                  </div>
                </div>

                {featuredThread && (
                  <ForumThreadCard thread={featuredThread} featured />
                )}
              </section>

              <ForumThreadList
                title={`Diskussioner i ${activeCategory.name}`}
                description={`${filteredThreads.length} diskussion${
                  filteredThreads.length === 1 ? "" : "er"
                } i ${activeCategory.groupName}.`}
                threads={filteredThreads}
              />
            </>
          )}
        </main>

        <ForumRightSidebar />
      </div>
    </div>
  );
}
