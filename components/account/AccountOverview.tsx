import ForumReputation from "./ForumReputation";
import InvestorLevelCard from "./InvestorLevelCard";
import InvestorProfileHero from "./InvestorProfileHero";
import InvestorStatistics from "./InvestorStatistics";
import PremiumMembershipCard from "./PremiumMembershipCard";
import PortfolioPrivacySection from "./PortfolioPrivacySection";
import ProfileHighlights from "./ProfileHighlights";

export default function AccountOverview() {
  return (
    <div className="space-y-6">
      <InvestorProfileHero />
      <ProfileHighlights />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <InvestorLevelCard />
        <PremiumMembershipCard />
      </section>

      <ForumReputation />
      <InvestorStatistics />
      <PortfolioPrivacySection />
    </div>
  );
}
