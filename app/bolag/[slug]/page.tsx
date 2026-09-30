import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CompanyComments from "@/components/companies/CompanyComments";
import CompanyPageContent from "@/components/companies/CompanyPageContent";
import AppShell from "@/components/layout/AppShell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getPilotCompanies } from "@/lib/companies/catalog";
import { loadCompanyPage } from "@/lib/companies/page-data.server";
import { companyPageJsonLd, companyPageMetadataCopy } from "@/lib/companies/page-seo";
import { getProfileForUser } from "@/lib/profiles/profile";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getPilotCompanies().map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const user = await getAuthenticatedUser();
  const loaded = await loadCompanyPage(slug, user?.id);

  if (!loaded) {
    return {
      title: `Bolag | ${DIVLAB_BRAND_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  const copy = companyPageMetadataCopy(loaded.company, loaded.model);
  const path = `/bolag/${loaded.company.slug}`;

  return {
    title: copy.title,
    description: copy.description,
    robots: copy.robots,
    alternates: { canonical: getCanonicalUrl(path) },
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: "website",
      url: getCanonicalUrl(path),
      locale: "sv_SE",
    },
    twitter: {
      card: "summary",
      title: copy.title,
      description: copy.description,
    },
  };
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const initialTab = typeof query.tab === "string" ? query.tab : undefined;
  const user = await getAuthenticatedUser();
  const loaded = await loadCompanyPage(slug, user?.id);

  if (!loaded) {
    notFound();
  }

  const profile = user ? await getProfileForUser(user.id) : null;
  const { company, articles, followState, officialData, peers, model, shortInterest, portfolios } = loaded;

  return (
    <AppShell allowGuest>
      <CompanyPageContent
        company={company}
        articles={articles}
        isAuthenticated={Boolean(user)}
        followState={followState}
        peers={peers}
        model={model}
        officialData={officialData}
        jsonLd={companyPageJsonLd(company)}
        shortInterest={shortInterest}
        portfolios={portfolios}
        initialTab={initialTab}
      >
        <CompanyComments
          companyId={followState.companyId}
          companySlug={company.slug}
          companyName={company.displayName}
          user={user}
          hasUsername={Boolean(profile?.username?.trim())}
        />
      </CompanyPageContent>
    </AppShell>
  );
}
