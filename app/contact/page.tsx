import LegalPlaceholderPage from "@/components/marketing/LegalPlaceholderPage";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export default function ContactPage() {
  return (
    <MarketingPageShell>
      <LegalPlaceholderPage
        title="Kontakt"
        description="Kontaktvägar för Dividend Lab."
      >
        <p>
          För frågor om plattformen, kontot eller integritet publiceras tydliga
          kontaktuppgifter här. Under MVP kan du nå oss via de kanaler som anges
          vid lansering.
        </p>
      </LegalPlaceholderPage>
    </MarketingPageShell>
  );
}
