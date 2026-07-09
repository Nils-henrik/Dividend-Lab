import AppShell from "@/components/layout/AppShell";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";

export default function SettingsPage() {
  return (
    <AppShell>
      <PlaceholderPage
        title="Inställningar"
        description="Inställningar samlar preferenser för Dividend Lab-upplevelsen."
      />
    </AppShell>
  );
}
