import type { UserProfile } from "@/lib/profiles/types";
import EducationalInsightsCard from "./EducationalInsightsCard";
import ForumPreview from "./ForumPreview";
import FreedomPlanCard from "./FreedomPlanCard";
import MarketPulse from "./MarketPulse";
import MarketToday from "./MarketToday";
import OnboardingCard from "./OnboardingCard";

type Props = {
  profile: UserProfile;
};

export default function DashboardShell({ profile }: Props) {
  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <p className="mb-3 divlab-section-label">DivLab</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
              Bättre koll på marknaden. Djupare förståelse.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-divlab-text-secondary">
              Följ marknaden, upptäck relevanta nyheter, använd smarta verktyg
              och utveckla din kunskap tillsammans med andra – allt samlat på
              ett ställe.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border divlab-border-neutral divlab-inset px-3 py-1 text-xs font-medium text-divlab-text-secondary">
            Marknad · Börsnyheter · Verktyg · Kunskap · Community
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
        <div className="hidden min-w-0 lg:block xl:col-span-2">
          <FreedomPlanCard />
        </div>
        <div className="space-y-6">
          <MarketToday compact />
          <MarketPulse compact />
          <OnboardingCard profile={profile} />
        </div>
      </section>

      <EducationalInsightsCard />

      <ForumPreview />
    </div>
  );
}
