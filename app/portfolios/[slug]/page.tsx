import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicContentShell from "@/components/layout/PublicContentShell";
import PortfolioDetailView from "@/components/portfolios/PortfolioDetailView";
import { PortfolioDetailPublicFallback } from "@/components/portfolios/ModelPortfoliosPublicFallback";
import JsonLdScript from "@/components/seo/JsonLd";
import {
  buildModelPortfolioDetailMetadata,
  getModelPortfolioPublicEntry,
} from "@/lib/model-portfolios/public";
import { loadPortfolioTransparencyDetail } from "@/lib/model-portfolios/transparency";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const metadata = buildModelPortfolioDetailMetadata(slug);
  if (!metadata) {
    return {
      title: "Modellportfölj",
      robots: { index: false, follow: false },
    };
  }
  return metadata;
}

export default async function PortfolioDetailPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const catalogEntry = getModelPortfolioPublicEntry(slug);
  if (!catalogEntry) notFound();

  const requestedPage = Number(query.page ?? "1");
  const detail = await loadPortfolioTransparencyDetail(slug, requestedPage);

  return (
    <PublicContentShell>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Hem", path: "/" },
          { name: "AI-portföljer", path: "/portfolios" },
          { name: catalogEntry.name, path: `/portfolios/${catalogEntry.slug}` },
        ])}
      />
      {detail ? (
        <PortfolioDetailView detail={detail} />
      ) : (
        <PortfolioDetailPublicFallback entry={catalogEntry} />
      )}
    </PublicContentShell>
  );
}
