import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import {
  getForumThreadsByLatestActivity,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";

export default async function DashboardPage() {
  const { profile } = await requireAuthenticatedUserWithProfile();
  let forumDiscussions: Awaited<
    ReturnType<typeof getForumThreadsByLatestActivity>
  > = [];

  try {
    forumDiscussions = await getForumThreadsByLatestActivity(5);
  } catch {
    forumDiscussions = [];
  }

  return (
    <DashboardShell
      profile={profile}
      forumDiscussions={forumDiscussions.map(mapThreadRecordToForumThread)}
    />
  );
}
