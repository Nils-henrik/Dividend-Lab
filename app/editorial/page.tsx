import type { Metadata } from "next";
import Link from "next/link";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import { getCanonicalUrl } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Redaktionella riktlinjer",
  description:
    "Hur DivLab arbetar med redaktionellt innehåll, källor, uppdateringar och skillnaden mellan information och finansiell rådgivning.",
  alternates: {
    canonical: getCanonicalUrl("/editorial"),
  },
};

export default function EditorialPage() {
  return (
    <MarketingPageShell>
      <article className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-20">
        <p className="divlab-section-label">Transparens</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-4xl">
          Redaktionella riktlinjer
        </h1>
        <p className="mt-5 text-lg leading-8 text-divlab-text-secondary">
          DivLab publicerar redaktionellt och informationellt innehåll om börsen,
          marknaden, privatekonomi och långsiktigt sparande. Målet är att göra
          ekonomisk information tydligare, mer begriplig och mer tillgänglig.
        </p>

        <div className="mt-12 space-y-10 text-base leading-7 text-divlab-text-secondary">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Vårt syfte
            </h2>
            <p>
              DivLab ska hjälpa läsaren att förstå vad som händer på marknaden
              och varför det är relevant.
            </p>
            <p>
              Vi strävar efter ett sakligt och lättbegripligt innehåll där
              fakta, sammanhang och förklaringar står i centrum. Komplicerade
              ekonomiska händelser ska kunna förstås även av den som inte
              arbetar professionellt med finans.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Redaktionellt ansvar
            </h2>
            <p>
              DivLab ansvarar för det innehåll som publiceras på plattformen.
            </p>
            <p>
              Inför publicering strävar vi efter att kontrollera centrala
              fakta, siffror, datum och andra uppgifter mot tillgängliga och
              relevanta källor. Vid osäkra eller snabbt föränderliga händelser
              försöker vi tydligt skilja mellan bekräftade uppgifter och sådant
              som ännu inte är fastställt.
            </p>
            <p>Vi publicerar inte rykten som fakta.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Information – inte personlig rådgivning
            </h2>
            <p>
              Innehållet på DivLab är avsett för allmän information, utbildning
              och analys.
            </p>
            <p>
              Artiklar, guider, marknadsdata, forumdiskussioner och verktyg är
              inte personlig finansiell rådgivning och ska inte betraktas som
              individuella rekommendationer att köpa, sälja eller behålla ett
              visst finansiellt instrument.
            </p>
            <p>
              Alla investeringar innebär risk och varje användare ansvarar själv
              för sina ekonomiska beslut.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Källor
            </h2>
            <p>
              DivLab använder offentligt tillgänglig information från exempelvis
              bolag, myndigheter, börser, rapporter, pressmeddelanden,
              nyhetskällor och marknadsdatatjänster.
            </p>
            <p>
              När externa uppgifter är centrala för en artikel strävar vi efter
              att ange källa eller hänvisa till den ursprungliga informationen
              där det är relevant.
            </p>
            <p>
              Kursuppgifter och annan marknadsdata kan vara fördröjda,
              preliminära eller förändras efter publicering.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Publicering och uppdateringar
            </h2>
            <p>Artiklar visar publiceringsdatum.</p>
            <p>
              När ny information tillkommer kan en artikel uppdateras för att
              bättre spegla det aktuella läget. Vid större eller betydelsefulla
              förändringar strävar vi efter att även visa när artikeln senast
              uppdaterades.
            </p>
            <p>
              Mindre språkliga rättelser, formateringsändringar eller
              korrigeringar som inte förändrar artikelns innebörd behöver inte
              alltid markeras separat.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Rättelser
            </h2>
            <p>Korrekt information är viktigt för DivLab.</p>
            <p>
              Om vi upptäcker ett sakfel rättar vi det så snart det är praktiskt
              möjligt. Om du som läsare upptäcker något som verkar fel får du
              gärna kontakta oss via{" "}
              <Link href="/contact" className="divlab-link font-medium">
                kontaktsidan
              </Link>
              .
            </p>
            <p>
              Rapporterade fel granskas och innehållet uppdateras när det finns
              anledning till det.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Marknaden förändras
            </h2>
            <p>
              Finansiella marknader rör sig snabbt. En artikel beskriver därför
              situationen utifrån den information som var tillgänglig vid
              publiceringen eller den senaste uppdateringen.
            </p>
            <p>
              Nya rapporter, kursrörelser, myndighetsbeslut eller andra
              händelser kan innebära att förutsättningarna förändras efter att
              en artikel publicerats.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Relaterade sidor
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Link href="/disclaimer" className="divlab-link">
                  Ansvarsfriskrivning
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="divlab-link">
                  Integritetspolicy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="divlab-link">
                  Användarvillkor
                </Link>
              </li>
              <li>
                <Link href="/contact" className="divlab-link">
                  Kontakt
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </MarketingPageShell>
  );
}
