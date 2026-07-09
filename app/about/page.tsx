import LegalPlaceholderPage from "@/components/marketing/LegalPlaceholderPage";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export default function AboutPage() {
  return (
    <MarketingPageShell>
      <LegalPlaceholderPage
        title="Om oss"
        description="För dig som följer marknaden."
      >
        <p>
          Dividend Lab är en plattform för dig som är intresserad av aktier,
          fonder, ETF:er, portföljer, utdelningar, trading och den finansiella
          marknaden i stort.
        </p>
        <p>
          Här samlas verktyg, utbildning, analys och community för att göra det
          enklare att följa marknaden, förstå investeringar och utveckla sitt
          eget sätt att tänka kring ekonomi och kapital. Oavsett om fokus ligger
          på utdelningar, tillväxt, fonder, index, trading eller portföljbygge
          ska DivLab vara en plats där kunskap, struktur och diskussion står i
          centrum.
        </p>
        <p>
          DivLab är inte en rådgivningstjänst och ger inga personliga
          investeringsrekommendationer eller köp- och säljsignaler.
        </p>
      </LegalPlaceholderPage>
    </MarketingPageShell>
  );
}
