import AppShell from "@/components/layout/AppShell";
import ForumThreadPage from "@/components/forum/ForumThreadPage";

type Props = {
  params: Promise<{
    threadId: string;
  }>;
};

export default async function ForumThreadRoute({ params }: Props) {
  const { threadId } = await params;

  return (
    <AppShell>
      <ForumThreadPage threadId={threadId} />
    </AppShell>
  );
}
