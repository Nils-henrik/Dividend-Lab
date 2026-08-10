import type { UserProfile } from "@/lib/profiles/types";
import type { ForumThread } from "@/types/forum";
import DashboardNewsFocus from "./DashboardNewsFocus";
import DashboardPortfolioTeaser from "./DashboardPortfolioTeaser";
import DashboardToolsCard from "./DashboardToolsCard";
import EducationalInsightsCard from "./EducationalInsightsCard";
import ForumPreview from "./ForumPreview";
import MarketPulse from "./MarketPulse";
import MarketToday from "./MarketToday";
import OnboardingCard from "./OnboardingCard";

type Props = {
  profile: UserProfile;
  forumDiscussions: ForumThread[];
};

export default function DashboardShell({ profile, forumDiscussions }: Props) {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8">
      <header className="grid gap-7 border-b divlab-border-neutral pb-7 xl:grid-cols-[minmax(280px,0.58fr)_minmax(0,1.42fr)] xl:items-center">
        <div>
          <p className="divlab-section-label">Översikt</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-divlab-text sm:text-4xl">
            Det viktigaste just nu
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary sm:text-base">
            Marknaden och det senaste från DivLab.
          </p>
        </div>

        <DashboardPortfolioTeaser />
      </header>

      <OnboardingCard profile={profile} />

      <section
        aria-label="Marknaden idag"
        className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)] xl:items-stretch"
      >
        <MarketToday compact />
        <MarketPulse compact />
      </section>

      <DashboardNewsFocus />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <ForumPreview discussions={forumDiscussions} />
        <EducationalInsightsCard />
      </section>

      <DashboardToolsCard />
    </div>
  );
}
