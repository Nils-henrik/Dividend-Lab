import AppShell from "@/components/layout/AppShell";
import ForumHomePage from "@/components/forum/ForumHomePage";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ForumPage({ searchParams }: Props) {
  const { category } = await searchParams;

  return (
    <AppShell>
      <ForumHomePage initialCategorySlug={category} />
    </AppShell>
  );
}
