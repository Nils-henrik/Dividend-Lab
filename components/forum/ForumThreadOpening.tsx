"use client";

import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import type { ForumThread } from "@/types/forum";
import type { ForumReactionSummary } from "@/lib/forum/reactions";
import ForumPostActionRow from "./ForumPostActionRow";
import ForumQualityReactions from "./ForumQualityReactions";
import ForumUserActions from "./ForumUserActions";

type Props = {
  thread: ForumThread;
  authorUsername: string;
  authorInitials: string;
  authorAvatarUrl?: string | null;
  memberSince: string;
  timestamp: string;
  threadSlug: string;
  reactions: ForumReactionSummary[];
  isAuthenticated: boolean;
  loginHref: string;
  currentUsername?: string | null;
  reactionsDisabled?: boolean;
  onReply: () => void;
  onQuote: () => void;
};

export default function ForumThreadOpening({
  thread,
  authorUsername,
  authorInitials,
  authorAvatarUrl = null,
  memberSince,
  timestamp,
  threadSlug,
  reactions,
  isAuthenticated,
  loginHref,
  currentUsername,
  reactionsDisabled = false,
  onReply,
  onQuote,
}: Props) {
  const normalizedUsername = authorUsername.replace(/^@/, "").toLowerCase();
  const profileHref = `/profile/${encodeURIComponent(normalizedUsername)}`;
  const messageHref = `/messages/new?username=${encodeURIComponent(
    normalizedUsername,
  )}`;
  const isSelf = currentUsername?.toLowerCase() === normalizedUsername;

  return (
    <article className="divlab-opening-post">
      <div className="grid gap-4 lg:grid-cols-[7.5rem_minmax(0,1fr)]">
        <aside className="border-b divlab-border-neutral pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
          <div className="group/forum-author relative">
            <div className="flex items-center gap-2.5 lg:block">
              <ProfileAvatar
                avatarUrl={authorAvatarUrl}
                initials={authorInitials}
                sizeClassName="h-9 w-9"
                textClassName="text-[11px] text-divlab-blue"
                fallbackClassName="border border-divlab-blue/25 bg-divlab-blue/10 font-semibold"
                imageAlt={`${authorUsername} profilbild`}
              />
              <div className="min-w-0 lg:mt-2">
                <Link
                  href={profileHref}
                  className="block truncate text-xs font-medium text-divlab-text transition hover:text-divlab-blue-muted focus:text-divlab-blue-muted focus:outline-none"
                >
                  @{authorUsername}
                </Link>
                <p className="mt-0.5 text-[11px] text-divlab-text-muted">{memberSince}</p>
              </div>
            </div>
            <ForumUserActions
              username={authorUsername}
              profileHref={profileHref}
              messageHref={messageHref}
              loginHref={loginHref}
              isSelf={isSelf}
              canMessage={isAuthenticated}
              canQuote={isAuthenticated}
              onQuote={onQuote}
            />
          </div>
        </aside>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-divlab-text-muted">{timestamp}</p>
            <span className="rounded-full border border-divlab-blue/25 bg-divlab-blue/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-divlab-blue-muted">
              Inledande inlägg
            </span>
          </div>

          <p className="max-w-4xl whitespace-pre-wrap text-sm leading-6 text-divlab-text">
            {thread.body}
          </p>

          {thread.id && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t divlab-border-neutral pt-3">
              <ForumQualityReactions
                targetType="thread"
                targetId={thread.id}
                threadSlug={threadSlug}
                reactions={reactions}
                isAuthenticated={isAuthenticated}
                loginHref={loginHref}
                disabled={reactionsDisabled}
              />
              <ForumPostActionRow
                isAuthenticated={isAuthenticated}
                loginHref={loginHref}
                onReply={onReply}
                onQuote={onQuote}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
