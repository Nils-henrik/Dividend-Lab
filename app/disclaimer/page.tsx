import LegalPlaceholderPage from "@/components/marketing/LegalPlaceholderPage";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export default function DisclaimerPage() {
  return (
    <MarketingPageShell>
      <LegalPlaceholderPage
        title="Ansvarsfriskrivning"
        description="Viktig information om DivLabs innehåll och begränsningar."
      >
        <p>
          DivLab tillhandahåller information, verktyg, utbildning och
          community-diskussion. Inget innehåll ska tolkas som personlig finansiell
          rådgivning, investeringsrekommendationer eller uppmaning att köpa eller
          sälja värdepapper.
        </p>
        <p>
          Investeringar innebär risk, inklusive risk för förlust av kapital.
          Historisk avkastning, beräkningar och exempel är ingen garanti för
          framtida resultat. Du ansvarar själv för dina investeringsbeslut.
        </p>
        <p id="reklam">
          DivLab kan i framtiden visa reklam eller använda affiliate-länkar. Sådan
          information redovisas transparent här när det införs, utan att påverka
          plattformens grundläggande utbildnings- och informationskaraktär.
        </p>
      </LegalPlaceholderPage>
    </MarketingPageShell>
  );
}
