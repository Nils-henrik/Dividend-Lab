import ForumHomePage from "@/components/forum/ForumHomePage";
import AppShell from "@/components/layout/AppShell";
import { getAuthenticatedUser } from "@/lib/auth/session";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ForumPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const user = await getAuthenticatedUser();

  if (user) {
    return (
      <AppShell user={user}>
        <ForumHomePage initialCategorySlug={category} isAuthenticated />
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="px-8 py-8">
        <ForumHomePage initialCategorySlug={category} />
      </div>
    </main>
  );
}
