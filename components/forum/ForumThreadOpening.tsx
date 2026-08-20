"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import {
  fetchForumThreadRevisionHistoryAction,
} from "@/app/forum/actions";
import { canEditForumContent } from "@/lib/forum/edit-eligibility";
import type { ForumThread } from "@/types/forum";
import type { ForumReactionSummary } from "@/lib/forum/reactions";
import ForumEditedLabel from "./ForumEditedLabel";
import ForumPostActionRow from "./ForumPostActionRow";
import ForumQualityReactions from "./ForumQualityReactions";
import ForumRevisionHistoryModal, {
  type ForumRevisionHistoryItem,
} from "./ForumRevisionHistoryModal";
import ForumThreadEditForm from "./ForumThreadEditForm";
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
  currentUserId?: string | null;
  isModerator?: boolean;
  isDemoContent?: boolean;
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
  currentUserId = null,
  isModerator = false,
  isDemoContent = false,
  reactionsDisabled = false,
  onReply,
  onQuote,
}: Props) {
  const router = useRouter();
  const normalizedUsername = authorUsername.replace(/^@/, "").toLowerCase();
  const profileHref = `/profile/${encodeURIComponent(normalizedUsername)}`;
  const messageHref = `/messages/new?username=${encodeURIComponent(
    normalizedUsername,
  )}`;
  const reportHref =
    !isDemoContent && thread.id
      ? `/report?targetType=forum_thread&targetId=${encodeURIComponent(thread.id)}&url=${encodeURIComponent(`/forum/${threadSlug}`)}`
      : undefined;
  const isSelf = currentUsername?.toLowerCase() === normalizedUsername;
  const moderateHref =
    isModerator && !isDemoContent && !isSelf && thread.id
      ? `/moderation/direct?targetType=forum_thread&targetId=${encodeURIComponent(thread.id)}`
      : undefined;
  const canEdit = canEditForumContent({
    isDemoContent,
    isAuthenticated,
    currentUserId,
    authorUserId: thread.authorUserId,
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
    if (!thread.id) {
      return;
    }

    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const items = await fetchForumThreadRevisionHistoryAction(thread.id);
      setHistoryItems(items);
    } catch {
      setHistoryError("Historiken kunde inte laddas. Försök igen.");
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [thread.id]);

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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] text-divlab-text-muted">{timestamp}</p>
              {thread.editedAt ? (
                <ForumEditedLabel
                  editedAt={thread.editedAt}
                  onOpenHistory={openHistory}
                />
              ) : null}
            </div>
            <span className="rounded-full border border-divlab-blue/25 bg-divlab-blue/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-divlab-blue-muted">
              Inledande inlägg
            </span>
          </div>

          {isEditing && thread.id ? (
            <ForumThreadEditForm
              threadId={thread.id}
              threadSlug={threadSlug}
              initialTitle={thread.title}
              initialBody={thread.body ?? ""}
              onCancel={() => setIsEditing(false)}
              onSuccess={handleEditSuccess}
            />
          ) : (
            <p className="max-w-4xl whitespace-pre-wrap text-sm leading-6 text-divlab-text">
              {thread.body}
            </p>
          )}

          {thread.id && !isEditing && (
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
                canEdit={canEdit}
                onEdit={() => setIsEditing(true)}
                reportHref={reportHref}
                moderateHref={moderateHref}
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
        showTitle
      />
    </article>
  );
}
