"use client";

import Link from "next/link";
import type { ForumThread } from "@/types/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumPageHeader from "./ForumPageHeader";
import ForumSubnav from "./ForumSubnav";
import ForumThreadList from "./ForumThreadList";

type Props = {
  title: string;
  description: string;
  threads: ForumThread[];
  breadcrumbLabel: string;
  isAuthenticated?: boolean;
};

export default function ForumThreadFeedPage({
  title,
  description,
  threads,
  breadcrumbLabel,
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
          { label: breadcrumbLabel },
        ]}
      />

      <ForumPageHeader
        title={title}
        description={description}
        isAuthenticated={isAuthenticated}
        newDiscussionHref={newDiscussionHref}
        loginHref={loginHref}
      />

      <ForumThreadList
        title={title}
        description={`${threads.length} diskussion${
          threads.length === 1 ? "" : "er"
        }.`}
        threads={threads}
      />

      <p className="text-center text-xs text-gray-600">
        <Link href="/forum" className="transition hover:text-gray-400">
          Tillbaka till forumöversikten
        </Link>
      </p>
    </div>
  );
}
