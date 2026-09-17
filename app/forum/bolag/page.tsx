import ForumCompanyDirectoryPage from "@/components/forum/companies/ForumCompanyDirectoryPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  parseForumCompanyCollectionParam,
  parseForumCompanyCountryParam,
  parseForumCompanySearchParam,
  type ForumCompanyCountryUrlValue,
} from "@/lib/forum/companies/filters";
import { getForumCompanyDirectory } from "@/lib/forum/companies/queries";
import { forumCompanyDirectoryJsonLd } from "@/lib/seo/forum-company-json-ld";
import { buildForumMetadata } from "@/lib/seo/forum-metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata = buildForumMetadata({
  title: "Bolagsforum – aktier och bolagsdiskussioner",
  description:
    "Utforska svenska och amerikanska bolag i DivLabs forum, filtrera på marknad och index och hitta rätt bolagssida för diskussion.",
  path: "/forum/bolag",
});

type Props = {
  searchParams: Promise<{
    q?: string;
    land?: string;
    lista?: string;
  }>;
};

function getActiveLandParam(
  land: string | undefined,
): ForumCompanyCountryUrlValue | null {
  if (!land) {
    return null;
  }

  const normalized = land.trim().toLowerCase();

  if (normalized === "sverige" || normalized === "usa") {
    return normalized;
  }

  return null;
}

export default async function ForumBolagPage({ searchParams }: Props) {
  const { q, land, lista } = await searchParams;
  const user = await getAuthenticatedUser();
  const query = parseForumCompanySearchParam(q);
  const countryCode = parseForumCompanyCountryParam(land);
  const activeLand = getActiveLandParam(land);

  const directory = await getForumCompanyDirectory({
    query,
    countryCode,
    collectionSlug: parseForumCompanyCollectionParam(lista),
  });

  const hasFilters = Boolean(q?.trim() || land?.trim() || lista?.trim());
  const structuredData = [
    breadcrumbJsonLd([
      { name: "Forum", path: "/forum" },
      { name: "Bolag", path: "/forum/bolag" },
    ]),
    ...(!hasFilters && !directory.isDirectoryUnavailable
      ? [forumCompanyDirectoryJsonLd(directory.companies)]
      : []),
  ];

  return (
    <ForumRouteShell user={user}>
      <JsonLdScript data={structuredData} />
      <ForumCompanyDirectoryPage
        directory={directory}
        activeLand={activeLand}
        activeLista={directory.filters.collectionSlug ?? null}
        query={query}
      />
    </ForumRouteShell>
  );
}
