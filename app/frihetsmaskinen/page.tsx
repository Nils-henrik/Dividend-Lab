import AppShell from "@/components/layout/AppShell";
import FreedomPlanCard from "@/components/dashboard/FreedomPlanCard";
import FrihetsmaskinenInspirationSection from "@/components/frihetsmaskinen/FrihetsmaskinenInspirationSection";

export default function FrihetsmaskinenPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <FreedomPlanCard />
        <FrihetsmaskinenInspirationSection />
      </div>
    </AppShell>
  );
}
