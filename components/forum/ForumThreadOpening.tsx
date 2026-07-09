"use client";

import Link from "next/link";
import type { ForumThread } from "@/types/forum";
import type { ForumReactionSummary } from "@/lib/forum/reactions";
import ForumPostActionRow from "./ForumPostActionRow";
import ForumQualityReactions from "./ForumQualityReactions";
import ForumUserActions from "./ForumUserActions";

type Props = {
  thread: ForumThread;
  authorUsername: string;
  authorInitials: string;
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
    <article className="rounded-md border border-white/10 bg-[#161616] px-2.5 py-2">
      <div className="grid gap-2 lg:grid-cols-[112px_1fr]">
        <aside className="border-b border-white/10 pb-2 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-2">
          <div className="group/forum-author relative">
            <div className="flex items-center gap-2 lg:block">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[11px] font-semibold text-[#D4AF37]">
                {authorInitials}
              </div>
              <div className="min-w-0 lg:mt-1.5">
                <Link
                  href={profileHref}
                  className="block truncate text-xs font-medium text-white transition hover:text-[#D4AF37] focus:text-[#D4AF37] focus:outline-none"
                >
                  @{authorUsername}
                </Link>
                <p className="mt-0.5 text-[11px] text-gray-500">{memberSince}</p>
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
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-1.5">
            <p className="text-[11px] text-gray-500">{timestamp}</p>
            <span className="rounded-md border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-0.5 text-[11px] font-medium text-[#D4AF37]">
              Inledande inlägg
            </span>
          </div>

          <p className="max-w-4xl whitespace-pre-wrap text-[0.9rem] leading-6 text-gray-300">
            {thread.body}
          </p>

          {thread.id && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-1.5">
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
