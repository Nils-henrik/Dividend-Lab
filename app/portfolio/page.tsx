import AppShell from "@/components/layout/AppShell";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";

export default function PortfolioPage() {
  return (
    <AppShell>
      <PlaceholderPage
        title="Portfölj"
        description="Portföljspårning samlar innehav, allokering och utdelningskvalitet i en lugn översikt."
      />
    </AppShell>
  );
}
