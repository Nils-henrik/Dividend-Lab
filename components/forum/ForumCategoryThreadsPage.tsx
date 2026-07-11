"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getForumCategory } from "@/data/forum";
import type { ForumCategoryGroup, ForumThread } from "@/types/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumPageHeader from "./ForumPageHeader";
import ForumSidebar from "./ForumSidebar";
import ForumSubnav from "./ForumSubnav";
import ForumThreadCard from "./ForumThreadCard";
import ForumThreadList from "./ForumThreadList";

type Props = {
  categorySlug: string;
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

export default function ForumCategoryThreadsPage({
  categorySlug,
  isAuthenticated = false,
  threads,
  categoryGroups,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeCategory = getForumCategory(categorySlug);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const newDiscussionHref = getNewDiscussionHref(categorySlug);
  const loginHref = getLoginHref(categorySlug);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesCategory = thread.categorySlug === categorySlug;
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
  }, [categorySlug, normalizedSearch, threads]);

  const featuredThread = filteredThreads[0] ?? null;

  return (
    <div className="space-y-3">
      <ForumSubnav />

      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: "Kategorier", href: "/forum/kategorier" },
          { label: activeCategory.name },
        ]}
      />

      <div className="grid gap-4 2xl:grid-cols-[230px_minmax(0,1fr)]">
        <ForumSidebar
          activeCategorySlug={categorySlug}
          categoryGroups={categoryGroups}
        />

        <main className="space-y-3">
          <ForumPageHeader
            title={activeCategory.name}
            description={activeCategory.description}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={`Sök diskussioner i ${activeCategory.name}...`}
            searchHint={`Söker bland inlästa diskussioner i ${activeCategory.name}.`}
            isAuthenticated={isAuthenticated}
            newDiscussionHref={newDiscussionHref}
            loginHref={loginHref}
          />

          {filteredThreads.length === 0 ? (
            <section className="divlab-card p-8 text-center">
              <p className="text-sm font-medium text-white">
                Inga diskussioner än
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Starta den första diskussionen i {activeCategory.name}.
              </p>
              {isAuthenticated ? (
                <Link
                  href={newDiscussionHref}
                  className="divlab-btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm"
                >
                  Starta diskussion
                </Link>
              ) : (
                <Link
                  href={loginHref}
                  className="divlab-btn-secondary mt-6 inline-flex px-5 py-2.5 text-sm transition hover:border-divlab-blue/30 hover:text-divlab-blue-muted"
                >
                  Logga in för att starta en diskussion
                </Link>
              )}
            </section>
          ) : (
            <>
              <section className="divlab-card p-3">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-medium text-white">
                    Utvald diskussion
                  </h2>
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
      </div>
    </div>
  );
}
