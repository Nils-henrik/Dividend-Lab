import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CompanyPageContent from "@/components/companies/CompanyPageContent";
import PublicContentShell from "@/components/layout/PublicContentShell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getCompanyProfile,
  getPilotCompanies,
} from "@/lib/companies/catalog";
import { getCompanyNews } from "@/lib/companies/news";
import { getCompanyFollowState } from "@/lib/companies/server";
import { getNewsArticles } from "@/lib/news/get-articles";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getPilotCompanies().map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyProfile(slug);

  if (!company) {
    return {
      title: `Bolag | ${DIVLAB_BRAND_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  const title = `${company.name} (${company.ticker}) – aktie, nyheter och rapporter`;
  const description = `Följ ${company.name}: TradingView-graf, senaste DivLab-artiklar, officiella pressmeddelanden och rapporter.`;
  const path = `/bolag/${company.slug}`;

  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(path) },
    openGraph: {
      title,
      description,
      type: "website",
      url: getCanonicalUrl(path),
      locale: "sv_SE",
    },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const company = getCompanyProfile(slug);

  if (!company) {
    notFound();
  }

  const user = await getAuthenticatedUser();
  const [articles, followState] = await Promise.all([
    Promise.resolve(getCompanyNews(company, getNewsArticles())),
    getCompanyFollowState(company.slug, user?.id),
  ]);

  return (
    <PublicContentShell>
      <CompanyPageContent
        company={company}
        articles={articles}
        isAuthenticated={Boolean(user)}
        followState={followState}
      />
    </PublicContentShell>
  );
}
