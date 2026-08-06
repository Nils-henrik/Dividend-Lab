import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";

export const metadata: Metadata = {
  title: "Portfölj",
  robots: { index: false, follow: false },
};

export default function PortfolioPage() {
  return (
    <AppShell>
      <PlaceholderPage
        title="Portfölj"
        statusLabel="Planerat"
        description="Portföljspårning är under planering. När den lanseras kommer den att samla innehav och översikt i en lugn vy — utan att bli ett handelsverktyg."
        backHref="/frihetsmaskinen"
        backLabel="Öppna Frihetsmaskinen"
      />
    </AppShell>
  );
}
