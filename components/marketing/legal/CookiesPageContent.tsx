import LegalPageLayout, { LegalList, LegalSection } from "@/components/marketing/LegalPageLayout";
import {
  ONBOARDING_STORAGE_KEY,
  RECOVERY_COOKIE_NAME,
  legalConfig,
} from "@/lib/legal/legal-config";

export default function CookiesPageContent() {
  const { serviceName } = legalConfig;

  return (
    <LegalPageLayout
      title="Cookiepolicy"
      description={`Information om cookies och liknande teknik som används i ${serviceName} under betaperioden.`}
    >
      <LegalSection title="Översikt">
        <p>
          Cookies och liknande teknik används för att tjänsten ska fungera, hålla dig inloggad
          och i vissa fall förbättra upplevelsen. Denna policy beskriver faktisk teknik i
          nuvarande version — den utgör inte bevis på färdigt samtyckeshanteringssystem.
        </p>
      </LegalSection>

      <LegalSection title="Nödvändig teknik">
        <p>
          Följande teknik bedöms nödvändig för grundläggande funktion i {serviceName}:
        </p>
        <LegalList
          items={[
            "Supabase Auth sessionscookies — håller dig inloggad och hanterar autentisering (första part, session/refresh enligt Supabase)",
            `${RECOVERY_COOKIE_NAME} — kortlivad cookie (ca 15 minuter) som styr lösenordsåterställningsflödet efter länk från e-post`,
          ]}
        />
        <p>
          Utan dessa kan inloggning, sessionshantering och säker återställning av lösenord inte
          fungera som avsett.
        </p>
      </LegalSection>

      <LegalSection title="Lokal lagring i webbläsaren (första part)">
        <p>
          Nyckeln <code className="text-divlab-text">{ONBOARDING_STORAGE_KEY}</code> används i
          localStorage för att komma ihåg om du besökt forumet som del av onboarding. Detta lagras
          lokalt i din webbläsare och används för att visa checklistestatus — inte för
          spårning i marknadsföringssyfte.
        </p>
        <p>
          Tekniken är inte strikt nödvändig för kärnfunktioner, men används för en enklare
          introduktionsupplevelse. Slutlig rättslig klassificering och eventuellt samtycke
          hanteras i samband med kommande cookie-lösning.
        </p>
      </LegalSection>

      <LegalSection title="Tredjepartsteknik">
        <p>
          När du som inloggad användare besöker dashboard kan ett inbäddat diagram från
          TradingView laddas. TradingView kan då använda egna cookies eller webbläsarlagring som{" "}
          {serviceName} inte fullt ut kontrollerar. Exakt omfattning beror på TradingView och din
          webbläsare.
        </p>
        <p>
          {serviceName} hämtar även nyhetsrubriker server-side från externa RSS-källor till vissa
          ytor. Detta sker utan att besökaren själv laddar tredjepartsskript för dessa flöden,
          men nätverkskontakt sker från {serviceName}s servrar.
        </p>
      </LegalSection>

      <LegalSection title="Det som inte används i nuläget">
        <p>{serviceName} använder avsiktligt inte i nuläget:</p>
        <LegalList
          items={[
            "reklamcookies",
            "affiliate-spårning",
            "Google Analytics",
            "marknadsföringspixlar",
          ]}
        />
        <p>
          Det utesluter inte att en tredjepart som du interagerar med via inbäddningar kan sätta
          egen lagring enligt sina villkor.
        </p>
      </LegalSection>

      <LegalSection title="Samtycke och inställningar">
        <p>
          Ingen mekanism för cookie-samtycke är implementerad i nuläget. Att läsa denna policy
          ersätter inte samtycke där sådant krävs enligt tillämpliga regler.
        </p>
        <p>
          Innan registrering öppnas brett ska valfri tredjepartsteknik antingen blockeras i väntan
          på ett giltigt val eller hanteras på annat tekniskt sätt som uppfyller tillämpliga krav.
        </p>
        <p>
          Du kan rensa cookies och webbplatsdata via webbläsarens inställningar. Det ersätter
          inte en framtida möjlighet att återkalla samtycke i tjänsten där så krävs.
        </p>
      </LegalSection>

      <LegalSection title="Mer information">
        <p>
          Se integritetspolicyn för hur personuppgifter behandlas i samband med cookies och
          lagring.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
