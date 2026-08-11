import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicContentShell from "@/components/layout/PublicContentShell";
import TradeDetailView from "@/components/portfolios/TradeDetailView";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";
import { loadPortfolioTradeDetail } from "@/lib/model-portfolios/transparency";

type Props = {
  params: Promise<{ slug: string; transactionId: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = noIndexMetadata("Affärsdetalj | Modellportföljer");

export default async function PortfolioTradePage({ params }: Props) {
  const { slug, transactionId } = await params;
  const detail = await loadPortfolioTradeDetail(slug, transactionId);

  if (!detail) notFound();

  return (
    <PublicContentShell>
      <TradeDetailView detail={detail} />
    </PublicContentShell>
  );
}
