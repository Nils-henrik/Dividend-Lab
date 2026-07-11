"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ForumCategoryGroup, ForumThread } from "@/types/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumCategoryItem from "./ForumCategoryItem";
import ForumPageHeader from "./ForumPageHeader";
import ForumSubnav from "./ForumSubnav";
import ForumThreadList from "./ForumThreadList";
import ForumThreadPreviewSection from "./ForumThreadPreviewSection";

type Props = {
  isAuthenticated?: boolean;
  latestThreads: ForumThread[];
  popularThreads: ForumThread[];
  allThreads: ForumThread[];
  categoryGroups: ForumCategoryGroup[];
};

function getNewDiscussionHref() {
  return "/forum/new";
}

function getLoginHref() {
  return `/login?redirect=${encodeURIComponent(getNewDiscussionHref())}`;
}

export default function ForumOverviewPage({
  isAuthenticated = false,
  latestThreads,
  popularThreads,
  allThreads,
  categoryGroups,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedSearch) {
      return [];
    }

    return allThreads.filter((thread) => {
      const searchableText = [
        thread.title,
        thread.excerpt,
        thread.author,
        thread.category,
        thread.group,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [allThreads, normalizedSearch]);

  return (
    <div className="space-y-3">
      <ForumSubnav />

      <ForumBreadcrumbs items={[{ label: "Forum" }]} />

      <ForumPageHeader
        title="Forum"
        description="Utforska diskussioner, kategorier och senaste aktivitet i Dividend Lab-gemenskapen."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Sök bland inlästa diskussioner..."
        searchHint="Söker bland inlästa diskussioner efter rubrik, kategori och avsändare."
        isAuthenticated={isAuthenticated}
        newDiscussionHref={getNewDiscussionHref()}
        loginHref={getLoginHref()}
      />

      {normalizedSearch ? (
        <ForumThreadList
          title="Sökresultat"
          description={`${searchResults.length} träff${
            searchResults.length === 1 ? "" : "ar"
          } bland inlästa diskussioner.`}
          threads={searchResults}
        />
      ) : (
        <>
          <ForumThreadPreviewSection
            title="Senaste diskussioner"
            threads={latestThreads}
            viewAllHref="/forum/senaste"
          />

          <ForumThreadPreviewSection
            title="Populära diskussioner"
            threads={popularThreads}
            viewAllHref="/forum/populart"
          />

          <section className="divlab-surface-panel p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-base font-semibold text-divlab-text">
                  Kategorier
                </h2>
                <p className="mt-1 text-sm text-divlab-text-muted">
                  Hitta diskussioner efter ämne och intresseområde.
                </p>
              </div>
              <Link
                href="/forum/kategorier"
                className="text-xs font-medium text-divlab-text-muted transition hover:text-divlab-blue-muted"
              >
                Visa alla kategorier
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {categoryGroups.map((group) => (
                <div key={group.slug}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400">
                    {group.name}
                  </p>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {group.categories.slice(0, 4).map((category) => (
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

          <section className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-sm text-divlab-text-secondary">
              Ny i forumet? Läs om ton, regler och DivLab-kulturen innan du
              deltar.
            </p>
            <Link
              href="/forum/regler"
              className="mt-2 inline-flex text-sm font-medium text-divlab-blue-muted transition hover:text-divlab-blue"
            >
              Läs forumregler och välkomstinfo
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
