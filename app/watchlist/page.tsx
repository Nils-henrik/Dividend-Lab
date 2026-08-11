import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata("Bevakningslista");

export default function WatchlistPage() {
  return (
    <AppShell>
      <PlaceholderPage
        title="Bevakningslista"
        statusLabel="Planerat"
        description="Bevakningslistan är under planering. När den lanseras hjälper den dig följa bolag över tid — utan att förvandla DivLab till ett handelsverktyg."
        backHref="/news"
        backLabel="Till Börsnyheter"
      />
    </AppShell>
  );
}
