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
  return `@${cleanUsername} skrev:\n> ${content}\n\n`;
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
            { label: "Diskussionen hittades inte" },
          ]}
        />
        <section className="divlab-card p-8 text-center">
          <p className="text-sm font-medium text-divlab-text">Diskussionen hittades inte</p>
          <p className="mt-2 text-sm text-divlab-text-muted">
            Denna diskussion är inte tillgänglig eller kan ha tagits bort.
          </p>
          <Link href="/forum" className="divlab-btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm">
            Tillbaka till forumet
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
      contextLabel: `Citerar @${post.username.replace(/^@/, "")}`,
      replaceText: false,
    });
  }

  function handleReplyToPost(post: ForumPostType) {
    if (!isAuthenticated) {
      return;
    }

    openReplyEditor({
      contextLabel: `Svarar @${post.username.replace(/^@/, "")}`,
      replaceText: true,
    });
  }

  function handleQuoteOpeningPost() {
    if (!isAuthenticated || !activeThread.body) {
      return;
    }

    openReplyEditor({
      quote: getQuoteText(openingAuthorUsername, activeThread.body),
      contextLabel: `Citerar @${openingAuthorUsername.replace(/^@/, "")}`,
      replaceText: false,
    });
  }

  function handleReplyToThread() {
    if (!isAuthenticated) {
      return;
    }

    openReplyEditor({
      contextLabel: "Svarar på denna diskussion",
      replaceText: true,
    });
  }

  function handleDemoQuote(post: ForumPostType) {
    openReplyEditor({
      quote: getQuoteText(post.username, post.content),
      contextLabel: `Citerar @${post.username.replace(/^@/, "")}`,
      replaceText: false,
    });
  }

  return (
    <div className="space-y-2.5">
      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          {
            label: category.name,
            href: `/forum?category=${category.slug}`,
          },
          { label: activeThread.title },
        ]}
      />

      <div className="grid gap-3 2xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <ForumSidebar activeCategorySlug={category.slug} />

        <main className="space-y-2">
          <section className="divlab-thread-header">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md border divlab-border-neutral px-2 py-0.5 text-[10px] font-medium text-divlab-text-muted">
                {activeThread.category}
              </span>
            </div>

            <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-divlab-text">
                  {activeThread.title}
                </h2>
                {!isDemoThread && (
                  <p className="mt-1.5 text-xs text-divlab-text-muted">
                    Startad av {activeThread.author}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-divlab-text-muted">
                <span className="tabular-nums">{activeThread.replies} svar</span>
                <span>·</span>
                <span>{activeThread.lastActivity}</span>
                <ForumShareButton
                  shareUrl={`/forum/${activeThread.slug}`}
                  shareTitle={activeThread.title}
                />
              </div>
            </div>
          </section>

          {isDemoThread && (
            <section className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-300">
                Förhandsvisning
              </p>
              <p className="mt-1 text-[11px] leading-5 text-gray-300">
                Exempelinnehåll för att testa forumfunktioner. Inte riktig
                medlemsaktivitet.
              </p>
            </section>
          )}

          {!isDemoThread && activeThread.body && (
            <div className="mb-8">
              <ForumThreadOpening
                thread={activeThread}
                authorUsername={openingAuthorUsername}
                authorInitials={openingAuthorInitials}
                authorAvatarUrl={activeThread.authorAvatarUrl ?? null}
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
            </div>
          )}

          <div id="forum-replies">
            {isDemoThread ? (
              <div className="divlab-reply-thread">
                {replies.map((post, index) => (
                  <ForumPost
                    key={post.id}
                    tone={index % 2 === 0 ? "a" : "b"}
                    post={post}
                    threadSlug={activeThread.slug}
                    reactions={emptyReactions}
                    isAuthenticated={isAuthenticated}
                    loginHref={loginHref}
                    currentUsername={currentUsername}
                    onQuote={handleDemoQuote}
                    onReply={() =>
                      openReplyEditor({
                        contextLabel: `Svarar @${post.username.replace(/^@/, "")}`,
                        replaceText: true,
                      })
                    }
                    reactionsDisabled
                  />
                ))}
              </div>
            ) : replies.length === 0 ? (
              <section className="divlab-card px-4 py-8 text-center">
                <p className="text-sm font-medium text-divlab-text">Inga svar än</p>
                <p className="mt-2 text-sm text-divlab-text-muted">
                  Var den första att svara i denna diskussion.
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
              <div className="divlab-reply-thread">
                {replies.map((post, index) => (
                  <ForumPost
                    key={post.id}
                    tone={index % 2 === 0 ? "a" : "b"}
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
                ))}
              </div>
            )}
          </div>

          {!isDemoThread && editorOpen && isAuthenticated && (
            <section
              id="forum-reply-editor"
              className="divlab-card p-4"
            >
              <p className="mb-3 divlab-section-label text-[11px]">Svara</p>
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
              className="divlab-card p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="divlab-section-label text-[11px]">
                  Förhandsvisning av svar
                </p>
                <button
                  type="button"
                  onClick={closeReplyEditor}
                  className="divlab-btn-ghost px-2 py-0.5 text-[11px]"
                >
                  Avbryt
                </button>
              </div>
              {replyContext && (
                <p className="mb-2 text-[11px] text-divlab-text-muted">{replyContext}</p>
              )}
              <textarea
                ref={replyEditorRef}
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                rows={5}
                placeholder="Citat infogas här för förhandsgranskning..."
                className="w-full resize-none divlab-input px-3 py-2 text-sm leading-6 placeholder:text-divlab-text-subtle"
              />
            </section>
          )}
        </main>

        <ForumRightSidebar />
      </div>
    </div>
  );
}
