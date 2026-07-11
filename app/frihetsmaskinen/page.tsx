import AppShell from "@/components/layout/AppShell";
import FreedomPlanCard from "@/components/dashboard/FreedomPlanCard";

export default function FrihetsmaskinenPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <FreedomPlanCard />
      </div>
    </AppShell>
  );
}
