import ForumThreadPage from "@/components/forum/ForumThreadPage";
import AppShell from "@/components/layout/AppShell";
import { getAuthenticatedUser } from "@/lib/auth/session";

type Props = {
  params: Promise<{
    threadId: string;
  }>;
};

export default async function ForumThreadRoute({ params }: Props) {
  const { threadId } = await params;
  const user = await getAuthenticatedUser();

  if (user) {
    return (
      <AppShell user={user}>
        <ForumThreadPage threadId={threadId} isAuthenticated />
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="px-8 py-8">
        <ForumThreadPage threadId={threadId} />
      </div>
    </main>
  );
}
