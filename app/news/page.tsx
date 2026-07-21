import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import NewsPageContent from "@/components/news/NewsPageContent";
import { getNewsArticles } from "@/lib/news/get-articles";

export const metadata: Metadata = {
  title: "Börsnyheter | DivLab",
  description:
    "Följ aktuella händelser från börsen och finansmarknaden i DivLab.",
};

export default function NewsPage() {
  const articles = getNewsArticles();

  return (
    <AppShell allowGuest>
      <NewsPageContent articles={articles} />
    </AppShell>
  );
}
