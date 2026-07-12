import LegalPageLayout, { LegalList, LegalSection } from "@/components/marketing/LegalPageLayout";
import {
  LEGAL_OPERATOR_PRIVACY,
  LEGAL_PRIVACY_CONTACT_PENDING,
  LEGAL_PRIVACY_RIGHTS_REQUEST,
  ONBOARDING_STORAGE_KEY,
  RECOVERY_COOKIE_NAME,
  legalConfig,
} from "@/lib/legal/legal-config";

export default function PrivacyPageContent() {
  const { serviceName, minAccountAge } = legalConfig;

  return (
    <LegalPageLayout
      title="Integritetspolicy"
      description={`Hur ${serviceName} behandlar personuppgifter under den kostnadsfria betaperioden. Policyn beskriver faktisk behandling i tjänsten — den utgör inte bevis på fullständig regelefterlevnad eller juridiskt slutgodkännande.`}
    >
      <LegalSection title="Personuppgiftsansvarig">
        <p>{LEGAL_OPERATOR_PRIVACY}</p>
        <p>{LEGAL_PRIVACY_CONTACT_PENDING}</p>
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
            "data kopplad till lösenordsåterställning",
            "lokal onboarding-inställning i webbläsaren (forum besökt)",
          ]}
        />
      </LegalSection>

      <LegalSection title="Hur uppgifterna samlas in">
        <p>
          Uppgifter samlas in när du registrerar konto, loggar in, redigerar profil, deltar i
          forum, skickar meddelanden, kommenterar artiklar eller använder andra funktioner som
          kräver konto. Vissa tekniska uppgifter skapas automatiskt vid användning, till exempel
          sessionscookies och loggar.
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
            "Vercel — hosting och server-side rendering av webbapplikationen",
            "TradingView — inbäddat marknadsdiagram i inloggad dashboard (besökarens webbläsare kan kontakta TradingView direkt)",
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
        <p>{LEGAL_PRIVACY_CONTACT_PENDING}</p>
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
          Tjänsten använder nödvändiga sessionscookies via Supabase Auth, kortlivad
          återställningscookie ({RECOVERY_COOKIE_NAME}) och lokal lagring för onboarding (
          {ONBOARDING_STORAGE_KEY}). TradingView kan sätta egen lagring när dashboard laddas.
          Se cookiepolicyn för mer information.
        </p>
        <p>
          Granulärt cookie-samtycke och preferenshantering är ännu inte implementerat.
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
        <p>{LEGAL_PRIVACY_CONTACT_PENDING}</p>
        <p>
          Klagomål kan även riktas till IMY.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
