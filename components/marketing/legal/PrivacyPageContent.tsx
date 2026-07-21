import ContactEmailLink from "@/components/marketing/ContactEmailLink";
import LegalPageLayout, { LegalList, LegalSection } from "@/components/marketing/LegalPageLayout";
import { LEGAL_PUBLISHED_VERSIONS } from "@/lib/legal/acceptance";
import {
  LEGAL_OPERATOR_PRIVACY,
  LEGAL_PRIVACY_RIGHTS_REQUEST,
  RECOVERY_COOKIE_NAME,
  TRADINGVIEW_WIDGET_SCRIPT,
  legalConfig,
} from "@/lib/legal/legal-config";

export default function PrivacyPageContent() {
  const { serviceName, minAccountAge } = legalConfig;

  return (
    <LegalPageLayout
      title="Integritetspolicy"
      description={`Hur ${serviceName} behandlar personuppgifter under den kostnadsfria betaperioden. Policyn beskriver faktisk behandling i tjänsten — den utgör inte bevis på fullständig regelefterlevnad eller juridiskt slutgodkännande.`}
      publishedVersion={LEGAL_PUBLISHED_VERSIONS.privacy}
    >
      <LegalSection title="Personuppgiftsansvarig">
        <p>{LEGAL_OPERATOR_PRIVACY}</p>
        <p>
          Integritetskontakt: <ContactEmailLink kind="privacy" />
        </p>
      </LegalSection>

      <LegalSection title="Vilka uppgifter som behandlas">
        <p>Beroende på hur du använder tjänsten kan följande kategorier behandlas:</p>
        <LegalList
          items={[
            "e-postadress och autentiseringsuppgifter (lösenord hanteras hashat via Supabase Auth; läsbart lösenord lagras inte av DivLab)",
            "konto-ID och kontometadata, till exempel skapelsedatum",
            "användarnamn, visningsnamn, biografi och investeringsrelaterade profilfält",
            "profilbild (avatar)",
            "forumtrådar, svar, reaktioner och aggregerad reputation",
            "privata meddelanden och konversationsämnen",
            "kommentarer på utbildningsartiklar",
            "läst/oläst-status i meddelanden",
            "sessions- och säkerhetsrelaterad teknisk data",
            "server- och felsökningsloggar hos driftleverantör",
            "anonymiserad, aggregerad trafik- och sidvisningsdata via Vercel Web Analytics (utan cookies)",
            "data kopplad till lösenordsåterställning",
          ]}
        />
      </LegalSection>

      <LegalSection title="Hur uppgifterna samlas in">
        <p>
          Uppgifter samlas in när du registrerar konto, loggar in, redigerar profil, deltar i
          forum, skickar meddelanden, kommenterar artiklar eller använder andra funktioner som
          kräver konto. Vissa tekniska uppgifter skapas automatiskt vid användning, till exempel
          sessionscookies, loggar och anonymiserad trafikstatistik via Vercel Web Analytics.
        </p>
      </LegalSection>

      <LegalSection title="Varför uppgifterna behandlas">
        <p>Personuppgifter behandlas i huvudsak för att:</p>
        <LegalList
          items={[
            "tillhandahålla och administrera konto",
            "autentisera användare och upprätthålla säkerhet",
            "visa offentliga profiler och community-funktioner",
            "möjliggöra privata meddelanden och kommentarer",
            "visa reaktioner och reputation",
            "driva, utveckla och felsöka tjänsten",
            "förstå aggregerad användning av webbplatsen via anonym trafikstatistik",
            "hantera support och rättsliga skyldigheter",
            "förebygga missbruk och otillåten användning",
          ]}
        />
      </LegalSection>

      <LegalSection title="Preliminära rättsliga grunder">
        <p>
          Behandlingen grundas preliminärt på följande kategorier, beroende på sammanhang.
          Slutlig bedömning kräver juridisk genomgång:
        </p>
        <LegalList
          items={[
            "fullgörande av användaravtal — för konto, kärnfunktioner och meddelanden",
            "berättigat intresse — för säkerhet, drift, missbruksförebyggande och utveckling, i den utsträckning intresset väger tyngre än den registrerades intressen",
            "rättslig förpliktelse — där tillämplig lag kräver det",
            "samtycke — endast för valfri teknik där samtycke faktiskt inhämtas och krävs; detta gäller inte valfria cookies i nuläget eftersom mekanism för det saknas",
          ]}
        />
        <p>
          Att läsa denna policy utgör inte i sig samtycke till behandling. Läsning av cookiepolicy
          ersätter inte cookie-samtycke där sådant krävs.
        </p>
      </LegalSection>

      <LegalSection title="Offentligt och privat innehåll">
        <p>
          Användarnamn, profiluppgifter, avatarer, forumtrådar, svar och synliga kommentarer kan
          vara offentligt tillgängliga för besökare och andra användare. Privata meddelanden är
          avsedda endast för deltagarna i respektive konversation.
        </p>
        <p>
          Publicera inte känsliga personuppgifter, konfidentiell information eller uppgifter om
          andra utan tillåtelse.
        </p>
      </LegalSection>

      <LegalSection title="Leverantörer och mottagare">
        <p>Följande externa leverantörer används i den nuvarande tekniska driften:</p>
        <LegalList
          items={[
            "Supabase — autentisering, databas, fillagring och relaterad infrastruktur",
            "Vercel — hosting, server-side rendering och Vercel Web Analytics (anonym, aggregerad trafikstatistik utan cookies)",
            "TradingView — officiell Symbol Overview-widget i inloggad dashboard (skript: " +
              TRADINGVIEW_WIDGET_SCRIPT +
              "). Widgeten initierar nätverkskontakt med TradingView och kan ta emot IP-adress, inbäddande sidas URL, widgettyp, visat marknadssymbol och vanlig begärandemetadata. DivLabs kod sätter inte TradingView-cookies",
            "externa RSS-/nyhetskällor — server-side hämtning av rubriker och länkar, till exempel från svenska nyhetsflöden",
          ]}
        />
        <p>
          Personuppgiftsbiträdesavtal och fullständig leverantörsbedömning ska verifieras
          operativt innan bredare lansering.
        </p>
      </LegalSection>

      <LegalSection title="Överföringar utanför EU/EES">
        <p>
          Vissa leverantörer kan behandla data utanför EU/EES eller använda underleverantörer
          globalt. Slutlig bedömning av överföringsmekanismer och skyddsåtgärder kräver
          operativ verifiering innan public lansering. Denna policy ersätter inte sådan bedömning.
        </p>
      </LegalSection>

      <LegalSection title="Lagring och radering">
        <p>
          Konto- och innehållsdata kvarstår i regel så länge kontot finns, om inte innehåll tas
          bort enligt tillgängliga funktioner eller efter begäran som hanteras enligt tillämplig
          lag. Fasta lagringsperioder för all behandling är ännu inte angivna i tjänsten.
        </p>
        <p>
          Tekniska loggar hos hosting-leverantör följer deras egna lagringsrutiner. Självbetjäning
          för export och kontoradering kan tillkomma senare som komplement till dina rättigheter.
          Radering av uppladdade avatarer vid kontoborttagning hanteras i samband med avslutad
          behandling.
        </p>
      </LegalSection>

      <LegalSection title="Säkerhet">
        <p>
          {serviceName} använder etablerade tekniska lösningar som åtkomstkontroll, krypterad
          transport (HTTPS) och databasregler (RLS) där det är implementerat. Ingen metod
          garanterar absolut säkerhet.
        </p>
      </LegalSection>

      <LegalSection title="Dina rättigheter">
        <p>
          Enligt tillämplig dataskyddslag har du rätt till tillgång, rättelse, radering,
          begränsning, invändning och dataportabilitet i relevanta fall. Att självservicefunktioner
          ännu saknas i tjänsten påverkar inte dessa rättigheter.
        </p>
        <p>{LEGAL_PRIVACY_RIGHTS_REQUEST}</p>
        <p>
          Integritetskontakt: <ContactEmailLink kind="privacy" />
        </p>
        <p>
          Du kan även lämna klagomål till Integritetsskyddsmyndigheten (IMY) i Sverige.
        </p>
      </LegalSection>

      <LegalSection title="Minderåriga">
        <p>
          {serviceName} är avsedd för personer som är {minAccountAge} år eller äldre. Konton ska
          inte skapas av minderåriga enligt denna avsikt.
        </p>
      </LegalSection>

      <LegalSection title="Cookies och webbläsarlagring">
        <p>
          Tjänsten använder nödvändiga Supabase Auth-sessionscookies via @supabase/ssr samt
          återställningscookien {RECOVERY_COOKIE_NAME} (15 minuter). DivLab använder inte
          localStorage eller sessionStorage i betan. Vercel Web Analytics använder inte cookies;
          den behandlar anonymiserad, aggregerad trafikdata. Se cookiepolicyn för detaljer om
          cookies.
        </p>
      </LegalSection>

      <LegalSection title="Ändringar av policyn">
        <p>
          Denna policy kan uppdateras när tjänsten eller behandlingen förändras. Datum för senast
          gällande version anges överst på sidan.
        </p>
      </LegalSection>

      <LegalSection title="Kontakt och klagomål">
        <p>{LEGAL_PRIVACY_RIGHTS_REQUEST}</p>
        <p>
          Integritetskontakt: <ContactEmailLink kind="privacy" />
        </p>
        <p>
          Klagomål kan även riktas till IMY.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
