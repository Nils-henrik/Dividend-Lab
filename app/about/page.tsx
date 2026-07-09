import LegalPlaceholderPage from "@/components/marketing/LegalPlaceholderPage";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export default function AboutPage() {
  return (
    <MarketingPageShell>
      <LegalPlaceholderPage
        title="Om oss"
        description="Vad Dividend Lab är och vem plattformen är byggd för."
      >
        <p>
          Dividend Lab är en lugn plattform för investerare som tänker långsiktigt
          kring utdelning, portfölj och finansiell frihet. Vi kombinerar
          utbildning, verktyg och community utan att bli ett handelsrum eller en
          rådgivningstjänst.
        </p>
      </LegalPlaceholderPage>
    </MarketingPageShell>
  );
}
