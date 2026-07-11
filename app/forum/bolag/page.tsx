import ForumCompanyDirectoryPage from "@/components/forum/companies/ForumCompanyDirectoryPage";
import ForumRouteShell from "@/components/forum/ForumRouteShell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  parseForumCompanyCollectionParam,
  parseForumCompanyCountryParam,
  parseForumCompanySearchParam,
  type ForumCompanyCountryUrlValue,
} from "@/lib/forum/companies/filters";
import { getForumCompanyDirectory } from "@/lib/forum/companies/queries";

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

  return (
    <ForumRouteShell user={user}>
      <ForumCompanyDirectoryPage
        directory={directory}
        activeLand={activeLand}
        activeLista={directory.filters.collectionSlug ?? null}
        query={query}
      />
    </ForumRouteShell>
  );
}
