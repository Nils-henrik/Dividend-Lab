import AppShell from "@/components/layout/AppShell";
import FreedomPlanCard from "@/components/dashboard/FreedomPlanCard";
import FireInspirationSection from "@/components/frihetsmaskinen/FireInspirationSection";

export default function FrihetsmaskinenPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <FreedomPlanCard />
        <FireInspirationSection />
      </div>
    </AppShell>
  );
}
