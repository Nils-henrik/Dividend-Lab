import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import { getDashboardForumThreadsByLatestActivity } from "@/lib/forum/dashboard-queries";
import type { ForumThread } from "@/types/forum";

export default async function DashboardPage() {
  const { profile } = await requireAuthenticatedUserWithProfile();
  let forumDiscussions: ForumThread[] = [];

  try {
    forumDiscussions = await getDashboardForumThreadsByLatestActivity(5);
  } catch {
    forumDiscussions = [];
  }

  return (
    <DashboardShell profile={profile} forumDiscussions={forumDiscussions} />
  );
}
