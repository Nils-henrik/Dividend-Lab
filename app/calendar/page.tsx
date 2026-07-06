import AppShell from "@/components/layout/AppShell";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";

export default function CalendarPage() {
  return (
    <AppShell>
      <PlaceholderPage
        title="Calendar"
        description="Calendar will organize upcoming dividends and portfolio events without introducing trading behavior."
      />
    </AppShell>
  );
}
