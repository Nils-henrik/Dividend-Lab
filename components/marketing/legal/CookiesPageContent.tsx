import LegalPageLayout, { LegalList, LegalSection } from "@/components/marketing/LegalPageLayout";
import {
  RECOVERY_COOKIE_NAME,
  TRADINGVIEW_WIDGET_SCRIPT,
  legalConfig,
} from "@/lib/legal/legal-config";

type StorageRow = {
  identifier: string;
  provider: string;
  purpose: string;
  type: string;
  duration: string;
  whenUsed: string;
};

const activeCookieRows: StorageRow[] = [
  {
    identifier:
      "Supabase Auth sessionscookies (namn kan variera per projekt, t.ex. sb-*-auth-token)",
    provider: "Supabase / DivLab (första part)",
    purpose: "Håller dig inloggad och hanterar autentisering via @supabase/ssr",
    type: "Nödvändig cookie",
    duration:
      "Sessions- och refresh-token enligt Supabase standard; uppdateras vid inloggning och session refresh",
    whenUsed: "Vid registrering, inloggning och autentiserade sidor",
  },
  {
    identifier: RECOVERY_COOKIE_NAME,
    provider: "DivLab (första part)",
    purpose: "Styr lösenordsåterställningsflödet efter länk från e-post",
    type: "Nödvändig cookie",
    duration: "900 sekunder (15 minuter)",
    whenUsed: "Under aktiv lösenordsåterställning",
  },
];

function StorageTable({ rows }: { rows: StorageRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b divlab-border-neutral text-divlab-text-muted">
            <th className="py-2 pr-3 font-medium">Teknisk identifierare</th>
            <th className="py-2 pr-3 font-medium">Leverantör</th>
            <th className="py-2 pr-3 font-medium">Syfte</th>
            <th className="py-2 pr-3 font-medium">Typ</th>
            <th className="py-2 pr-3 font-medium">Lagringstid</th>
            <th className="py-2 font-medium">När den används</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.identifier} className="border-b divlab-border-neutral align-top">
              <td className="py-3 pr-3 text-divlab-text">{row.identifier}</td>
              <td className="py-3 pr-3 text-divlab-text-secondary">{row.provider}</td>
              <td className="py-3 pr-3 text-divlab-text-secondary">{row.purpose}</td>
              <td className="py-3 pr-3 text-divlab-text-secondary">{row.type}</td>
              <td className="py-3 pr-3 text-divlab-text-secondary">{row.duration}</td>
              <td className="py-3 text-divlab-text-secondary">{row.whenUsed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiesPageContent() {
  const { serviceName } = legalConfig;

  return (
    <LegalPageLayout
      title="Cookiepolicy"
      description={`Aktiv cookie- och lagringsteknik i ${serviceName} under den kostnadsfria betan.`}
    >
      <LegalSection title="Översikt">
        <p>
          {serviceName} använder i nuläget endast teknik som behövs för inloggning, sessioner och
          lösenordsåterställning. Denna policy beskriver den verifierade implementationen — inte
          framtida planer.
        </p>
      </LegalSection>

      <LegalSection title="Aktiva cookies">
        <p>
          Supabase Auth hanteras via <code className="text-divlab-text">@supabase/ssr</code>.
          DivLab skapar inte egna autentiseringscookies manuellt. Ett eller flera förstapartscookies
          sätts och uppdateras av Supabase-klienten vid inloggning, session refresh och utloggning.
        </p>
        <div className="mt-4">
          <StorageTable rows={activeCookieRows} />
        </div>
        <p className="mt-4">
          Exakta cookie-namn kan variera mellan Supabase-projekt och token-segment. DivLab
          hårdkodar inte cookie-namn i källkoden.
        </p>
      </LegalSection>

      <LegalSection title={`Återställningscookie: ${RECOVERY_COOKIE_NAME}`}>
        <p>Verifierade attribut i implementationen:</p>
        <LegalList
          items={[
            `Namn: ${RECOVERY_COOKIE_NAME}`,
            "Syfte: hålla användaren i lösenordsåterställningsflödet",
            "Max-Age: 900 sekunder (15 minuter)",
            "Path: /",
            "SameSite: Lax",
            "Secure: ja på HTTPS, annars nej (utvecklingsmiljö)",
            "HttpOnly: nej — cookie sätts både via JavaScript (document.cookie) och serversvar utan httpOnly-flagga",
          ]}
        />
        <p>
          Cookien rensas när återställningen slutförts eller avbryts via befintligt flöde.
        </p>
      </LegalSection>

      <LegalSection title="Lokal lagring i webbläsaren">
        <p>
          {serviceName} använder för närvarande inte localStorage, sessionStorage eller IndexedDB
          för funktioner i betan. Tidigare betaversioner kunde spara onboarding-status lokalt; detta
          används inte längre.
        </p>
      </LegalSection>

      <LegalSection title="Extern inbäddad tjänst">
        <p>
          När du som inloggad användare besöker dashboard laddas TradingViews officiella widget{" "}
          <em>Symbol Overview</em> via skriptet{" "}
          <code className="break-all text-divlab-text">{TRADINGVIEW_WIDGET_SCRIPT}</code>.
        </p>
        <p>
          DivLabs egen widget-kod skriver inte cookies eller webbläsarlagring. Widgeten initierar
          nätverkskontakt med TradingView för att hämta diagramdata. TradingView kan då ta emot
          teknisk information såsom IP-adress, inbäddande sidas URL, widgettyp och visat
          marknadssymbol, samt vanlig begärandemetadata.
        </p>
        <p>
          TradingView listas inte som cookie i tabellen ovan eftersom DivLabs implementation inte
          verifierar att widgeten sätter cookies i webbläsaren.
        </p>
      </LegalSection>

      <LegalSection title="Ingen valfri cookie-teknik">
        <p>{serviceName} använder avsiktligt inte i nuläget:</p>
        <LegalList
          items={[
            "analyticscookies",
            "reklamcookies",
            "affiliate-spårning",
            "marknadsföringspixlar",
            "valfria preferenscookies",
          ]}
        />
        <p>
          Vercel Web Analytics används för anonym, aggregerad trafikstatistik och sätter inte
          cookies. Den tekniken beskrivs i integritetspolicyn, inte som cookie i tabellen ovan.
        </p>
        <p>
          DivLab visar därför ingen cookie-banner i den nuvarande betan. En mekanism för samtycke
          införs innan teknik som kräver samtycke aktiveras.
        </p>
      </LegalSection>

      <LegalSection title="Webbläsarkontroller och utloggning">
        <p>
          Autentiseringscookies uppdateras och avslutas genom Supabase utloggningsflöde i tjänsten.
          Du kan även rensa cookies och webbplatsdata via webbläsarens inställningar.
        </p>
        <p>
          Webbläsarrensning ersätter inte en framtida funktion för att återkalla samtycke om valfri
          teknik läggs till senare.
        </p>
      </LegalSection>

      <LegalSection title="Mer information">
        <p>
          Se integritetspolicyn för hur personuppgifter behandlas i samband med autentisering,
          hosting och externa tjänster som TradingView.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
