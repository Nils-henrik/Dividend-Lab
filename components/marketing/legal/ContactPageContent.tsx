import LegalPageLayout, { LegalSection } from "@/components/marketing/LegalPageLayout";
import {
  LEGAL_OPERATOR_TERMS,
  LEGAL_POSTAL_ADDRESS,
  LEGAL_PRIVACY_CONTACT_PENDING,
  LEGAL_PRIVACY_RIGHTS_REQUEST,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_SUPPORT_EMAIL,
  legalConfig,
} from "@/lib/legal/legal-config";

const contactCategories = [
  {
    title: "Allmän support",
    description:
      "Frågor om kontot, tjänstens funktioner och tekniska problem under betaperioden.",
  },
  {
    title: "Integritet och dataskydd",
    description:
      "Begäran om tillgång, rättelse, radering, begränsning, invändning eller dataportabilitet enligt tillämplig dataskyddslag.",
  },
  {
    title: "Olagligt eller otillåtet innehåll",
    description:
      "Anmälan av innehåll som kan bryta mot lag eller användarvillkoren.",
  },
  {
    title: "Upphovsrätt",
    description:
      "Frågor om material som du anser kränker upphovsrätt eller annan immateriell rättighet.",
  },
] as const;

export default function ContactPageContent() {
  const { serviceName } = legalConfig;

  return (
    <LegalPageLayout
      title="Kontakt"
      description={`Kontaktinformation för ${serviceName}. ${LEGAL_OPERATOR_TERMS}`}
    >
      <LegalSection title="Operatör">
        <p>{LEGAL_OPERATOR_TERMS}</p>
        <p>
          Tjänsten erbjuds i kostnadsfri beta och är inte ett registrerat bolag.
        </p>
      </LegalSection>

      <LegalSection title="Kontaktkategorier">
        <p>
          När verifierade kontaktuppgifter publiceras kan du vända dig till {serviceName} inom
          följande områden:
        </p>
        <div className="mt-4 space-y-5">
          {contactCategories.map((category) => (
            <div
              key={category.title}
              className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-4"
            >
              <h3 className="text-sm font-semibold text-divlab-text">{category.title}</h3>
              <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Integritetsbegäran">
        <p>{LEGAL_PRIVACY_RIGHTS_REQUEST}</p>
        <p>{LEGAL_PRIVACY_CONTACT_PENDING}</p>
      </LegalSection>

      <LegalSection title="Kontaktuppgifter">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-divlab-text">
            Verifierade kontaktuppgifter måste publiceras innan registrering öppnas brett.
          </p>
          <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
            Det finns ännu ingen aktiv kontaktformulärfunktion i tjänsten. E-post och postadress
            publiceras här när de är verifierade.
          </p>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-divlab-text-muted">
          <li>Support-e-post: {LEGAL_SUPPORT_EMAIL ?? "ej publicerad ännu"}</li>
          <li>Integritetskontakt: {LEGAL_PRIVACY_EMAIL ?? "ej publicerad ännu"}</li>
          <li>Postadress: {LEGAL_POSTAL_ADDRESS ?? "ej publicerad ännu"}</li>
        </ul>
      </LegalSection>
    </LegalPageLayout>
  );
}
