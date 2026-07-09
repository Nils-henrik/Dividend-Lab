import LegalPlaceholderPage from "@/components/marketing/LegalPlaceholderPage";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export default function PrivacyPage() {
  return (
    <MarketingPageShell>
      <LegalPlaceholderPage
        title="Integritetspolicy"
        description="Hur Dividend Lab hanterar personuppgifter och skyddar din integritet."
      >
        <p>
          DivLab behandlar personuppgifter för att tillhandahålla konto, inloggning
          och grundläggande plattformsfunktioner. En fullständig integritetspolicy
          med detaljer om lagring, rättigheter och kontakt med personuppgiftsansvarig
          publiceras här innan lansering.
        </p>
      </LegalPlaceholderPage>
    </MarketingPageShell>
  );
}
