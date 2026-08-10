import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PortfolioDetailView from "@/components/portfolios/PortfolioDetailView";
import { resolveCombinedMarketStatus } from "@/lib/model-portfolios/engine/market-hours";
import { loadPortfolioTransparencyDetail } from "@/lib/model-portfolios/transparency";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} | Modellportföljer`,
    robots: { index: false, follow: false },
  };
}

export default async function PortfolioDetailPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const requestedPage = Number(query.page ?? "1");
  const detail = await loadPortfolioTransparencyDetail(slug, requestedPage);
  const marketStatus = resolveCombinedMarketStatus();

  if (!detail) notFound();

  return (
    <AppShell>
      <PortfolioDetailView detail={detail} marketStatus={marketStatus} />
    </AppShell>
  );
}
