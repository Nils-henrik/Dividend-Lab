import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import CompanyWatchlist from "@/components/companies/CompanyWatchlist";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getFollowedCompanies } from "@/lib/companies/server";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata("Bevakningslista");

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const user = await requireAuthenticatedUser();
  const watchlist = await getFollowedCompanies(user.id);

  return (
    <AppShell user={user}>
      <CompanyWatchlist
        companies={watchlist.companies}
        isAvailable={watchlist.isAvailable}
      />
    </AppShell>
  );
}
