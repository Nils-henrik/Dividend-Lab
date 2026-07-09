import type { UserProfile } from "@/lib/profiles/types";
import EducationalInsightsCard from "./EducationalInsightsCard";
import FireCalculatorCard from "./FireCalculatorCard";
import ForumPreview from "./ForumPreview";
import MarketPulse from "./MarketPulse";
import OnboardingCard from "./OnboardingCard";

type Props = {
  profile: UserProfile;
};

export default function DashboardShell({ profile }: Props) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
              DivLab Start
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white">
              Bygg din frihetsplan med utdelningar
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
              Planera långsiktigt, lär dig mer om utdelning och FIRE, och hitta
              stöd i communityn — innan portföljintegrationer finns på plats.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
            Planering · Utbildning · Community
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <FireCalculatorCard />
        </div>
        <div className="w-full xl:w-[min(100%,360px)] xl:shrink-0">
          <OnboardingCard profile={profile} />
        </div>
      </section>

      <EducationalInsightsCard />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
        <ForumPreview />
        <MarketPulse />
      </section>
    </div>
  );
}
