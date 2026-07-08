import ForumThreadPage from "@/components/forum/ForumThreadPage";
import AppShell from "@/components/layout/AppShell";
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
      author: `@${forumDemoPosts[0]?.username ?? "demo-preview"}`,
      authorUsername: forumDemoPosts[0]?.username ?? "demo-preview",
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

export default async function ForumThreadRoute({ params }: Props) {
  const { threadId } = await params;
  const user = await getAuthenticatedUser();

  let thread: ForumThread | null = null;
  let replies: ForumPost[] = [];
  let reactionMap: ForumReactionMap = {};
  let isDemoThread = false;
  let openingAuthorUsername = "";
  let openingAuthorInitials = "DL";
  let openingMemberSince = "Dividend Lab member";
  let openingTimestamp = "";

  if (isForumDemoThread(threadId)) {
    const demo = getDemoThreadView();
    thread = demo.thread;
    replies = demo.replies;
    reactionMap = getDemoReactionMap();
    isDemoThread = true;
    openingAuthorUsername = demo.replies[0]?.username ?? "demo-preview";
    openingAuthorInitials = demo.replies[0]?.avatar ?? "DP";
    openingMemberSince = demo.replies[0]?.memberSince ?? "Development preview";
    openingTimestamp = demo.replies[0]?.timestamp ?? "Preview";
  } else {
    const threadRecord = await getForumThreadBySlugFromDatabase(threadId);

    if (threadRecord) {
      thread = mapThreadRecordToForumThread(threadRecord);
      openingAuthorUsername = getForumAuthorUsername(
        threadRecord.authorUsername,
        threadRecord.authorDisplayName,
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

    return (
      <AppShell user={session.user} identity={session.identity}>
        <ForumThreadPage
          thread={thread}
          replies={replies}
          reactionMap={reactionMap}
          isDemoThread={isDemoThread}
          isAuthenticated
          currentUsername={session.identity.username}
          openingAuthorUsername={openingAuthorUsername}
          openingAuthorInitials={openingAuthorInitials}
          openingMemberSince={openingMemberSince}
          openingTimestamp={openingTimestamp}
        />
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="px-8 py-8">
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
      </div>
    </main>
  );
}
