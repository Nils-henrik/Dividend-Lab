import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import {
  getForumThreadsByLatestActivity,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";
import type { ForumThread } from "@/types/forum";

export default async function DashboardPage() {
  const { profile } = await requireAuthenticatedUserWithProfile();
  let forumDiscussions: ForumThread[] = [];

  try {
    const records = await getForumThreadsByLatestActivity(5);
    forumDiscussions = records.flatMap((record) => {
      try {
        return [mapThreadRecordToForumThread(record)];
      } catch {
        return [];
      }
    });
  } catch {
    forumDiscussions = [];
  }

  return (
    <DashboardShell profile={profile} forumDiscussions={forumDiscussions} />
  );
}
