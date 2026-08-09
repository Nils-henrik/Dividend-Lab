import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import TradeDetailView from "@/components/portfolios/TradeDetailView";
import { loadPortfolioTradeDetail } from "@/lib/model-portfolios/transparency";

type Props = {
  params: Promise<{ slug: string; transactionId: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Affärsdetalj | Modellportföljer",
  robots: { index: false, follow: false },
};

export default async function PortfolioTradePage({ params }: Props) {
  const { slug, transactionId } = await params;
  const detail = await loadPortfolioTradeDetail(slug, transactionId);

  if (!detail) notFound();

  return (
    <AppShell>
      <TradeDetailView detail={detail} />
    </AppShell>
  );
}
