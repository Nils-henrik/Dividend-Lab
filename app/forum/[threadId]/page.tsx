import type { Metadata } from "next";
import ForumThreadPage from "@/components/forum/ForumThreadPage";
import AppShell from "@/components/layout/AppShell";
import PublicPageShell from "@/components/layout/PublicPageShell";
import JsonLdScript from "@/components/seo/JsonLd";
import {
  getAuthenticatedUser,
  requireAuthenticatedUserWithProfile,
} from "@/lib/auth/session";
import { forumDemoPosts, forumDemoThread } from "@/data/forum-demo";
import { isForumDemoThread } from "@/data/forum";
import {
  getForumAuthorInitials,
  formatForumMemberSince,
  formatForumTimestamp,
  getForumAuthorUsername,
} from "@/lib/forum/format";
import {
  buildEmptyReactionSummaries,
  getForumReactionTargetKey,
  type ForumReactionMap,
} from "@/lib/forum/reactions";
import { getForumReactionsForThreadPage } from "@/lib/forum/reactions.server";
import {
  getForumRepliesByThreadIdFromDatabase,
  getForumThreadBySlugFromDatabase,
  mapReplyRecordToForumPost,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";
import { isModeratorUser } from "@/lib/moderation/access.server";
import {
  breadcrumbJsonLd,
  discussionForumPostingJsonLd,
} from "@/lib/seo/json-ld";
import { buildForumMetadata } from "@/lib/seo/forum-metadata";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";
import type { ForumPost, ForumThread } from "@/types/forum";

type Props = {
  params: Promise<{
    threadId: string;
  }>;
};

function getDemoThreadView(): {
  thread: ForumThread;
  replies: ForumPost[];
  isDemoThread: true;
} {
  return {
    thread: {
      id: "demo-thread",
      slug: forumDemoThread.slug,
      title: forumDemoThread.title,
      body: forumDemoPosts[0]?.content,
      categorySlug: forumDemoThread.categorySlug,
      category: forumDemoThread.category,
      groupSlug: forumDemoThread.groupSlug,
      group: forumDemoThread.group,
      author: `@${forumDemoPosts[0]?.username ?? "divlab-test"}`,
      authorUsername: forumDemoPosts[0]?.username ?? "divlab-test",
      replies: 0,
      lastActivity: forumDemoThread.lastActivity,
      excerpt: forumDemoThread.excerpt,
      tags: forumDemoThread.tags,
    },
    replies: forumDemoPosts,
    isDemoThread: true,
  };
}

function getDemoReactionMap(): ForumReactionMap {
  const emptyReactions = buildEmptyReactionSummaries();

  return {
    [getForumReactionTargetKey("thread", "demo-thread")]: emptyReactions,
    [getForumReactionTargetKey("reply", "demo-post-1")]: emptyReactions,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;

  if (isForumDemoThread(threadId)) {
    return {
      title: `Internt testinnehåll | ${DIVLAB_BRAND_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const threadRecord = await getForumThreadBySlugFromDatabase(threadId);

  if (!threadRecord) {
    return {
      title: `Forumtråd | ${DIVLAB_BRAND_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const thread = mapThreadRecordToForumThread(threadRecord);
  const description =
    thread.excerpt?.trim() ||
    `Diskussion i DivLabs forum: ${thread.title}`;

  return buildForumMetadata({
    title: thread.title,
    description: description.slice(0, 160),
    path: `/forum/${thread.slug}`,
  });
}

export default async function ForumThreadRoute({ params }: Props) {
  const { threadId } = await params;
  const user = await getAuthenticatedUser();

  let thread: ForumThread | null = null;
  let replies: ForumPost[] = [];
  let reactionMap: ForumReactionMap = {};
  let isDemoThread = false;
  let openingAuthorUsername = "";
  let openingAuthorInitials = "DL";
  let openingMemberSince = "DivLab-medlem";
  let openingTimestamp = "";

  if (isForumDemoThread(threadId)) {
    const demo = getDemoThreadView();
    thread = demo.thread;
    replies = demo.replies;
    reactionMap = getDemoReactionMap();
    isDemoThread = true;
    openingAuthorUsername = demo.replies[0]?.username ?? "divlab-test";
    openingAuthorInitials = demo.replies[0]?.avatar ?? "DT";
    openingMemberSince = demo.replies[0]?.memberSince ?? "Internt testinnehåll";
    openingTimestamp = demo.replies[0]?.timestamp ?? "Internt testinnehåll";
  } else {
    const threadRecord = await getForumThreadBySlugFromDatabase(threadId);

    if (threadRecord) {
      thread = mapThreadRecordToForumThread(threadRecord);
      openingAuthorUsername = getForumAuthorUsername(
        threadRecord.authorUsername,
      );
      openingAuthorInitials = getForumAuthorInitials(
        threadRecord.authorUsername,
        threadRecord.authorDisplayName,
      );
      openingMemberSince = formatForumMemberSince(
        threadRecord.authorProfileCreatedAt,
      );
      openingTimestamp = formatForumTimestamp(threadRecord.createdAt);

      const replyRecords = await getForumRepliesByThreadIdFromDatabase(
        threadRecord.id,
      );
      replies = replyRecords.map(mapReplyRecordToForumPost);
      reactionMap = await getForumReactionsForThreadPage(
        threadRecord.id,
        replyRecords.map((reply) => reply.id),
        user?.id ?? null,
      );
    }
  }

  if (user) {
    const session = await requireAuthenticatedUserWithProfile();
    const isModerator = await isModeratorUser(session.user.id);

    return (
      <AppShell user={session.user} identity={session.identity}>
        <ForumThreadPage
          thread={thread}
          replies={replies}
          reactionMap={reactionMap}
          isDemoThread={isDemoThread}
          isAuthenticated
          isModerator={isModerator}
          currentUsername={session.identity.username}
          currentUserId={session.user.id}
          openingAuthorUsername={openingAuthorUsername}
          openingAuthorInitials={openingAuthorInitials}
          openingMemberSince={openingMemberSince}
          openingTimestamp={openingTimestamp}
        />
      </AppShell>
    );
  }

  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {thread && !isDemoThread ? (
        <JsonLdScript
          data={[
            discussionForumPostingJsonLd({
              title: thread.title,
              description: thread.excerpt || thread.title,
              path: `/forum/${thread.slug}`,
              authorName: thread.authorUsername || thread.author,
              commentCount: thread.replies,
            }),
            breadcrumbJsonLd([
              { name: "Hem", path: "/" },
              { name: "Forum", path: "/forum" },
              {
                name: thread.title,
                path: `/forum/${thread.slug}`,
              },
            ]),
          ]}
        />
      ) : null}
      <ForumThreadPage
        thread={thread}
        replies={replies}
        reactionMap={reactionMap}
        isDemoThread={isDemoThread}
        openingAuthorUsername={openingAuthorUsername}
        openingAuthorInitials={openingAuthorInitials}
        openingMemberSince={openingMemberSince}
        openingTimestamp={openingTimestamp}
      />
    </PublicPageShell>
  );
}
