import type { Metadata } from "next";
import ForumCompanyDetailPage from "@/components/forum/companies/ForumCompanyDetailPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getForumCompanyBySlug } from "@/lib/forum/companies/queries";
import { buildForumMetadata } from "@/lib/seo/forum-metadata";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    companySlug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companySlug } = await params;
  const { company, isDirectoryUnavailable } =
    await getForumCompanyBySlug(companySlug);

  if (isDirectoryUnavailable) {
    return noIndexMetadata(`Bolagskatalog | ${DIVLAB_BRAND_NAME}`);
  }

  if (!company) {
    return noIndexMetadata(`Bolag | ${DIVLAB_BRAND_NAME}`);
  }

  const description =
    `Diskussion och bolagsöversikt för ${company.name} (${company.primaryTicker}) i DivLabs forum.`.slice(
      0,
      160,
    );

  return buildForumMetadata({
    title: `${company.name} (${company.primaryTicker})`,
    description,
    path: `/forum/bolag/${company.slug}`,
  });
}

export default async function ForumCompanyPage({ params }: Props) {
  const { companySlug } = await params;
  const user = await getAuthenticatedUser();
  const { company, isDirectoryUnavailable } =
    await getForumCompanyBySlug(companySlug);

  if (isDirectoryUnavailable) {
    return (
      <ForumRouteShell user={user}>
        <div className="space-y-3">
          <section className="divlab-card p-8 text-center">
            <p className="text-sm font-medium text-divlab-text">
              Bolagskatalogen är inte tillgänglig än
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-divlab-text-muted">
              Databasmigrationen för bolagskatalogen behöver appliceras innan
              bolagssidor kan läsas.
            </p>
          </section>
        </div>
      </ForumRouteShell>
    );
  }

  if (!company) {
    notFound();
  }

  return (
    <ForumRouteShell user={user}>
      <ForumCompanyDetailPage company={company} />
    </ForumRouteShell>
  );
}
