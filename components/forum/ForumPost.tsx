"use client";

import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import type { ForumPost as ForumPostType } from "@/types/forum";
import type { ForumReactionSummary } from "@/lib/forum/reactions";
import ForumPostActionRow from "./ForumPostActionRow";
import ForumQualityReactions from "./ForumQualityReactions";
import ForumUserActions from "./ForumUserActions";

type Props = {
  post: ForumPostType;
  threadSlug: string;
  reactions: ForumReactionSummary[];
  isAuthenticated: boolean;
  loginHref: string;
  currentUsername?: string | null;
  onQuote: (post: ForumPostType) => void;
  onReply: (post: ForumPostType) => void;
  reactionsDisabled?: boolean;
  tone?: "a" | "b";
};

export default function ForumPost({
  post,
  threadSlug,
  reactions,
  isAuthenticated,
  loginHref,
  currentUsername,
  onQuote,
  onReply,
  reactionsDisabled = false,
  tone = "a",
}: Props) {
  const username = post.username.replace(/^@/, "");
  const normalizedUsername = username.toLowerCase();
  const profileHref = `/profile/${encodeURIComponent(normalizedUsername)}`;
  const messageHref = `/messages/new?username=${encodeURIComponent(
    normalizedUsername,
  )}`;
  const isSelf = currentUsername?.toLowerCase() === normalizedUsername;

  return (
    <article
      className={`divlab-reply-row ${tone === "a" ? "divlab-reply-row-a" : "divlab-reply-row-b"}`}
    >
      <div className="grid gap-4 lg:grid-cols-[7.5rem_minmax(0,1fr)]">
        <aside className="lg:pr-4">
          <div className="group/forum-author relative">
            <div className="flex items-center gap-2.5 lg:block">
              <ProfileAvatar
                avatarUrl={post.avatarUrl ?? null}
                initials={post.avatar}
                sizeClassName="h-9 w-9"
                textClassName="text-[11px]"
                imageAlt={`${username} profilbild`}
              />
              <div className="min-w-0 lg:mt-2">
                <Link
                  href={profileHref}
                  className="block truncate text-xs font-medium text-divlab-text transition hover:text-divlab-blue-muted focus:text-divlab-blue-muted focus:outline-none"
                >
                  @{username}
                </Link>
                <p className="mt-0.5 text-[11px] text-divlab-text-muted">
                  {post.memberSince}
                </p>
              </div>
            </div>
            <ForumUserActions
              username={username}
              profileHref={profileHref}
              messageHref={messageHref}
              loginHref={loginHref}
              isSelf={isSelf}
              canMessage={isAuthenticated}
              canQuote={isAuthenticated}
              onQuote={() => onQuote(post)}
            />
          </div>
        </aside>

        <div>
          <p className="mb-2 text-[11px] text-divlab-text-muted">{post.timestamp}</p>

          <p className="max-w-4xl whitespace-pre-wrap text-sm leading-6 text-divlab-text-secondary">
            {post.content}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3">
            <ForumQualityReactions
              targetType="reply"
              targetId={post.id}
              threadSlug={threadSlug}
              reactions={reactions}
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
              disabled={reactionsDisabled}
            />
            <ForumPostActionRow
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
              onReply={() => onReply(post)}
              onQuote={() => onQuote(post)}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
