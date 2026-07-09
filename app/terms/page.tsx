import LegalPlaceholderPage from "@/components/marketing/LegalPlaceholderPage";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export default function TermsPage() {
  return (
    <MarketingPageShell>
      <LegalPlaceholderPage
        title="Villkor"
        description="Användarvillkor för Dividend Lab och hur plattformen får användas."
      >
        <p>
          Här publiceras villkor för konton, innehåll, community och tillgång till
          DivLabs verktyg. Tills dess gäller sunt förnuft, respektfullt
          deltagande och att plattformen används som stöd för egen analys — inte
          som ersättning för professionell rådgivning.
        </p>
      </LegalPlaceholderPage>
    </MarketingPageShell>
  );
}
