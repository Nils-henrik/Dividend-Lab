import LegalPlaceholderPage from "@/components/marketing/LegalPlaceholderPage";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export default function CookiesPage() {
  return (
    <MarketingPageShell>
      <LegalPlaceholderPage
        title="Cookiepolicy"
        description="Information om cookies och liknande teknik på Dividend Lab."
      >
        <p>
          DivLab använder i första hand teknik som behövs för inloggning, säkerhet
          och grundläggande funktion. En tydlig cookiepolicy och eventuella val
          publiceras här när det behövs för produkten.
        </p>
      </LegalPlaceholderPage>
    </MarketingPageShell>
  );
}
