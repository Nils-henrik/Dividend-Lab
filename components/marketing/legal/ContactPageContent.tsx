import ContactEmailLink from "@/components/marketing/ContactEmailLink";
import LegalPageLayout, { LegalSection } from "@/components/marketing/LegalPageLayout";
import {
  LEGAL_OPERATOR_TERMS,
  LEGAL_POSTAL_ADDRESS,
  LEGAL_PRIVACY_RIGHTS_REQUEST,
  legalConfig,
} from "@/lib/legal/legal-config";
import { DIVLAB_CONTACT } from "@/lib/site/contact";

const contactCategories = [
  {
    title: "Allmän support",
    description:
      "Frågor om kontot, tjänstens funktioner och tekniska problem under betaperioden.",
    emailKind: "general" as const,
  },
  {
    title: "Integritet och dataskydd",
    description:
      "Begäran om tillgång, rättelse, radering, begränsning, invändning eller dataportabilitet enligt tillämplig dataskyddslag.",
    emailKind: "privacy" as const,
  },
  {
    title: "Olagligt eller otillåtet innehåll",
    description:
      "Anmälan av innehåll som kan bryta mot lag eller användarvillkoren.",
    emailKind: "general" as const,
  },
  {
    title: "Upphovsrätt",
    description:
      "Frågor om material som du anser kränker upphovsrätt eller annan immateriell rättighet.",
    emailKind: "general" as const,
  },
] as const;

export default function ContactPageContent() {
  const { serviceName } = legalConfig;

  return (
    <LegalPageLayout
      title="Kontakt"
      description={`Kontaktinformation för ${serviceName}.`}
    >
      <LegalSection title="Operatör">
        <p>{LEGAL_OPERATOR_TERMS}</p>
        <p>
          Tjänsten erbjuds i kostnadsfri beta och är inte ett registrerat bolag.
        </p>
      </LegalSection>

      <LegalSection title="Kontaktkategorier">
        <p>Du kan vända dig till {serviceName} inom följande områden:</p>
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
              <p className="mt-3 text-sm text-divlab-text-muted">
                E-post:{" "}
                <ContactEmailLink kind={category.emailKind} />
              </p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Integritetsbegäran">
        <p>{LEGAL_PRIVACY_RIGHTS_REQUEST}</p>
        <p className="mt-3">
          Integritetskontakt: <ContactEmailLink kind="privacy" />
        </p>
      </LegalSection>

      <LegalSection title="Kontaktuppgifter">
        <p className="text-sm leading-6 text-divlab-text-secondary">
          Det finns ännu ingen aktiv kontaktformulärfunktion i tjänsten. Använd e-postadresserna
          nedan för att nå {serviceName}.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-divlab-text-secondary">
          <li>
            Allmän kontakt: <ContactEmailLink kind="general" />
          </li>
          <li>
            Integritet och dataskydd: <ContactEmailLink kind="privacy" />
          </li>
          <li>Postadress: {LEGAL_POSTAL_ADDRESS ?? "ej publicerad ännu"}</li>
        </ul>
        <p className="mt-4 text-xs leading-5 text-divlab-text-muted">
          Transaktionella meddelanden om konto skickas separat och ska inte ersätta allmän
          kontakt via {DIVLAB_CONTACT.generalEmail}.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
