"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getForumCategory } from "@/data/forum";
import {
  buildEmptyReactionSummaries,
  getForumReactionTargetKey,
  type ForumReactionMap,
} from "@/lib/forum/reactions";
import type { ForumPost as ForumPostType, ForumThread } from "@/types/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumReplyForm from "./ForumReplyForm";
import ForumRightSidebar from "./ForumRightSidebar";
import ForumPost from "./ForumPost";
import ForumPostActionRow from "./ForumPostActionRow";
import ForumShareButton from "./ForumShareButton";
import ForumSidebar from "./ForumSidebar";
import ForumThreadOpening from "./ForumThreadOpening";

type Props = {
  thread: ForumThread | null;
  replies: ForumPostType[];
  reactionMap: ForumReactionMap;
  isDemoThread?: boolean;
  isAuthenticated?: boolean;
  currentUsername?: string | null;
  currentUserId?: string | null;
  openingAuthorUsername: string;
  openingAuthorInitials: string;
  openingMemberSince: string;
  openingTimestamp: string;
};

function getQuoteText(username: string, content: string) {
  const cleanUsername = username.replace(/^@/, "");
  return `@${cleanUsername} wrote:\n> ${content}\n\n`;
}

export default function ForumThreadPage({
  thread,
  replies,
  reactionMap,
  isDemoThread = false,
  isAuthenticated = false,
  currentUsername = null,
  currentUserId = null,
  openingAuthorUsername,
  openingAuthorInitials,
  openingMemberSince,
  openingTimestamp,
}: Props) {
  const replyEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [replyContext, setReplyContext] = useState<string | null>(null);

  if (!thread) {
    return (
      <div className="space-y-2.5">
        <ForumBreadcrumbs
          items={[
            { label: "Forum", href: "/forum" },
            { label: "Discussion not found" },
          ]}
        />
        <section className="rounded-md border border-white/10 bg-[#161616] p-8 text-center">
          <p className="text-sm font-medium text-white">Discussion not found</p>
          <p className="mt-2 text-sm text-gray-500">
            This discussion is not available or may have been removed.
          </p>
          <Link
            href="/forum"
            className="mt-6 inline-flex rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Back to forum
          </Link>
        </section>
      </div>
    );
  }

  const category = getForumCategory(thread.categorySlug);
  const activeThread = thread;
  const loginHref = `/login?redirect=${encodeURIComponent(
    `/forum/${activeThread.slug}`,
  )}`;
  const emptyReactions = buildEmptyReactionSummaries();
  const threadReactions =
    activeThread.id &&
    reactionMap[getForumReactionTargetKey("thread", activeThread.id)]
      ? reactionMap[getForumReactionTargetKey("thread", activeThread.id)]
      : emptyReactions;
  const isOpeningAuthor =
    Boolean(currentUserId) && currentUserId === activeThread.authorUserId;

  function focusReplyEditor() {
    window.requestAnimationFrame(() => {
      replyEditorRef.current?.focus();
      replyEditorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }

  function openReplyEditor(options?: {
    quote?: string;
    contextLabel?: string | null;
    replaceText?: boolean;
  }) {
    if (options?.quote) {
      setReplyText((currentText) =>
        options.replaceText
          ? options.quote ?? ""
          : `${currentText ? `${currentText}\n\n` : ""}${options.quote}`,
      );
    } else if (options?.replaceText) {
      setReplyText("");
    }

    setReplyContext(options?.contextLabel ?? null);
    setEditorOpen(true);
    focusReplyEditor();
  }

  function closeReplyEditor() {
    setEditorOpen(false);
    setReplyContext(null);
    setReplyText("");
  }

  function handleQuoteFromPost(post: ForumPostType) {
    if (!isAuthenticated) {
      return;
    }

    openReplyEditor({
      quote: getQuoteText(post.username, post.content),
      contextLabel: `Quoting @${post.username.replace(/^@/, "")}`,
      replaceText: false,
    });
  }

  function handleReplyToPost(post: ForumPostType) {
    if (!isAuthenticated) {
      return;
    }

    openReplyEditor({
      contextLabel: `Replying to @${post.username.replace(/^@/, "")}`,
      replaceText: true,
    });
  }

  function handleQuoteOpeningPost() {
    if (!isAuthenticated || !activeThread.body) {
      return;
    }

    openReplyEditor({
      quote: getQuoteText(openingAuthorUsername, activeThread.body),
      contextLabel: `Quoting @${openingAuthorUsername.replace(/^@/, "")}`,
      replaceText: false,
    });
  }

  function handleReplyToThread() {
    if (!isAuthenticated) {
      return;
    }

    openReplyEditor({
      contextLabel: "Replying to this discussion",
      replaceText: true,
    });
  }

  function handleDemoQuote(post: ForumPostType) {
    openReplyEditor({
      quote: getQuoteText(post.username, post.content),
      contextLabel: `Quoting @${post.username.replace(/^@/, "")}`,
      replaceText: false,
    });
  }

  return (
    <div className="space-y-2.5">
      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          {
            label: category.groupName,
            href: `/forum?category=${category.slug}`,
          },
          { label: category.name, href: `/forum?category=${category.slug}` },
          { label: activeThread.title },
        ]}
      />

      <div className="grid gap-3 2xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <ForumSidebar activeCategorySlug={category.slug} />

        <main className="space-y-2">
          <section className="rounded-md border border-white/10 bg-[#111111]/85 px-3 py-2.5">
            <div className="mb-1.5 flex flex-wrap items-center gap-1">
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-500">
                {activeThread.category}
              </span>
            </div>

            <div className="flex flex-col justify-between gap-2 xl:flex-row xl:items-start">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">
                  {activeThread.title}
                </h2>
                {!isDemoThread && (
                  <p className="mt-1 text-xs text-gray-500">
                    Started by {activeThread.author}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                <span className="tabular-nums">{activeThread.replies} replies</span>
                <span>·</span>
                <span>{activeThread.lastActivity}</span>
                <ForumShareButton />
              </div>
            </div>
          </section>

          {isDemoThread && (
            <section className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-300">
                Development preview
              </p>
              <p className="mt-1 text-[11px] leading-5 text-gray-300">
                Sample content for testing forum interactions only. Not real
                member activity.
              </p>
            </section>
          )}

          {!isDemoThread && activeThread.body && (
            <ForumThreadOpening
              thread={activeThread}
              authorUsername={openingAuthorUsername}
              authorInitials={openingAuthorInitials}
              memberSince={openingMemberSince}
              timestamp={openingTimestamp}
              threadSlug={activeThread.slug}
              reactions={threadReactions}
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
              currentUsername={currentUsername}
              reactionsDisabled={isOpeningAuthor}
              onReply={handleReplyToThread}
              onQuote={handleQuoteOpeningPost}
            />
          )}

          <div id="forum-replies" className="space-y-2">
            {isDemoThread ? (
              replies.map((post) => (
                <ForumPost
                  key={post.id}
                  post={post}
                  threadSlug={activeThread.slug}
                  reactions={emptyReactions}
                  isAuthenticated={isAuthenticated}
                  loginHref={loginHref}
                  currentUsername={currentUsername}
                  onQuote={handleDemoQuote}
                  onReply={() =>
                    openReplyEditor({
                      contextLabel: `Replying to @${post.username.replace(/^@/, "")}`,
                      replaceText: true,
                    })
                  }
                  reactionsDisabled
                />
              ))
            ) : replies.length === 0 ? (
              <section className="rounded-md border border-white/10 bg-[#161616] px-4 py-8 text-center">
                <p className="text-sm font-medium text-white">No replies yet</p>
                <p className="mt-2 text-sm text-gray-500">
                  Be the first to reply to this discussion.
                </p>
                <div className="mt-4 flex justify-center">
                  <ForumPostActionRow
                    isAuthenticated={isAuthenticated}
                    loginHref={loginHref}
                    onReply={handleReplyToThread}
                    onQuote={handleQuoteOpeningPost}
                  />
                </div>
              </section>
            ) : (
              replies.map((post) => (
                <ForumPost
                  key={post.id}
                  post={post}
                  threadSlug={activeThread.slug}
                  reactions={
                    reactionMap[getForumReactionTargetKey("reply", post.id)] ??
                    emptyReactions
                  }
                  isAuthenticated={isAuthenticated}
                  loginHref={loginHref}
                  currentUsername={currentUsername}
                  onQuote={handleQuoteFromPost}
                  onReply={handleReplyToPost}
                  reactionsDisabled={
                    Boolean(currentUserId) && currentUserId === post.authorUserId
                  }
                />
              ))
            )}
          </div>

          {!isDemoThread && editorOpen && isAuthenticated && (
            <section
              id="forum-reply-editor"
              className="rounded-md border border-white/10 bg-[#161616] p-3"
            >
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Reply
              </p>
              <ForumReplyForm
                threadSlug={activeThread.slug}
                body={replyText}
                onBodyChange={setReplyText}
                textareaRef={replyEditorRef}
                onCancel={closeReplyEditor}
                replyContext={replyContext}
              />
            </section>
          )}

          {isDemoThread && editorOpen && isAuthenticated && (
            <section
              id="forum-reply-editor"
              className="rounded-md border border-white/10 bg-[#161616] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                  Reply preview
                </p>
                <button
                  type="button"
                  onClick={closeReplyEditor}
                  className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-400 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              {replyContext && (
                <p className="mb-2 text-[11px] text-gray-500">{replyContext}</p>
              )}
              <textarea
                ref={replyEditorRef}
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                rows={5}
                placeholder="Quote inserts text here for preview testing..."
                className="w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-sm leading-6 text-gray-300 outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/60"
              />
            </section>
          )}
        </main>

        <ForumRightSidebar />
      </div>
    </div>
  );
}
