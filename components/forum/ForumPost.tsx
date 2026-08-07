"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import {
  fetchForumReplyRevisionHistoryAction,
} from "@/app/forum/actions";
import { canEditForumContent } from "@/lib/forum/edit-eligibility";
import type { ForumPost as ForumPostType } from "@/types/forum";
import type { ForumReactionSummary } from "@/lib/forum/reactions";
import ForumEditedLabel from "./ForumEditedLabel";
import ForumPostActionRow from "./ForumPostActionRow";
import ForumQualityReactions from "./ForumQualityReactions";
import ForumReplyEditForm from "./ForumReplyEditForm";
import ForumRevisionHistoryModal, {
  type ForumRevisionHistoryItem,
} from "./ForumRevisionHistoryModal";
import ForumUserActions from "./ForumUserActions";

type Props = {
  post: ForumPostType;
  threadSlug: string;
  reactions: ForumReactionSummary[];
  isAuthenticated: boolean;
  loginHref: string;
  currentUsername?: string | null;
  currentUserId?: string | null;
  isDemoContent?: boolean;
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
  currentUserId = null,
  isDemoContent = false,
  onQuote,
  onReply,
  reactionsDisabled = false,
  tone = "a",
}: Props) {
  const router = useRouter();
  const username = post.username.replace(/^@/, "");
  const normalizedUsername = username.toLowerCase();
  const profileHref = `/profile/${encodeURIComponent(normalizedUsername)}`;
  const messageHref = `/messages/new?username=${encodeURIComponent(
    normalizedUsername,
  )}`;
  const isSelf = currentUsername?.toLowerCase() === normalizedUsername;
  const canEdit = canEditForumContent({
    isDemoContent,
    isAuthenticated,
    currentUserId,
    authorUserId: post.authorUserId,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<ForumRevisionHistoryItem[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const handleEditSuccess = useCallback(() => {
    setIsEditing(false);
    router.refresh();
  }, [router]);

  const openHistory = useCallback(async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const items = await fetchForumReplyRevisionHistoryAction(post.id);
      setHistoryItems(items);
    } catch {
      setHistoryError("Historiken kunde inte laddas. Försök igen.");
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [post.id]);

  return (
    <article
      id={`reply-${post.id}`}
      className={`divlab-reply-row scroll-mt-24 lg:scroll-mt-28 ${tone === "a" ? "divlab-reply-row-a" : "divlab-reply-row-b"}`}
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
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-[11px] text-divlab-text-muted">{post.timestamp}</p>
            {post.editedAt ? (
              <ForumEditedLabel
                editedAt={post.editedAt}
                onOpenHistory={openHistory}
              />
            ) : null}
          </div>

          {isEditing ? (
            <ForumReplyEditForm
              replyId={post.id}
              threadSlug={threadSlug}
              initialBody={post.content}
              onCancel={() => setIsEditing(false)}
              onSuccess={handleEditSuccess}
            />
          ) : (
            <p className="max-w-4xl whitespace-pre-wrap text-sm leading-6 text-divlab-text-secondary">
              {post.content}
            </p>
          )}

          {!isEditing && (
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
                canEdit={canEdit}
                onEdit={() => setIsEditing(true)}
              />
            </div>
          )}
        </div>
      </div>

      <ForumRevisionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Redigeringshistorik"
        items={historyItems}
        isLoading={historyLoading}
        errorMessage={historyError}
      />
    </article>
  );
}
