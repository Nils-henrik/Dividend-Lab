import type { Metadata } from "next";
import Link from "next/link";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: `Redaktionella riktlinjer | ${DIVLAB_BRAND_NAME}`,
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
          DivLab publicerar informationellt och redaktionellt material för att
          hjälpa svenska sparare förstå marknaden, privatekonomi och långsiktigt
          sparande.
        </p>

        <div className="mt-12 space-y-10 text-base leading-7 text-divlab-text-secondary">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Syfte
            </h2>
            <p>
              Vårt syfte är att erbjuda tydlig, lugn och saklig information —
              inte personlig finansiell rådgivning och inte individuella
              investeringsrekommendationer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Information är inte rådgivning
            </h2>
            <p>
              Artiklar, guider, forumdiskussioner och verktyg som Frihetsmaskinen
              är avsedda för allmän kunskap och reflektion. Marknadsinformation
              kan förändras efter publicering. Du ansvarar själv för dina beslut.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Källor
            </h2>
            <p>
              När vi använder externa uppgifter strävar vi efter att ange källa
              eller länk där det är relevant. Kursuppgifter och marknadsdata är
              ögonblicksbilder och kan vara försenade eller ofullständiga.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Publicering och uppdateringar
            </h2>
            <p>
              Artiklar visar publiceringsdatum. När innehåll väsentligt
              uppdateras strävar vi efter att visa ett uppdateringsdatum.
              Mindre språkliga rättelser behöver inte alltid anges.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              Rättelser
            </h2>
            <p>
              Om du upptäcker ett sakfel, kontakta oss via{" "}
              <Link href="/contact" className="divlab-link font-medium">
                kontaktsidan
              </Link>
              . Vi granskar rapporterade fel och uppdaterar innehållet när det
              är motiverat.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-divlab-text">
              AI-stöd
            </h2>
            <p>
              DivLab kan använda AI-verktyg som stöd i research, struktur och
              språklig bearbetning. Redaktionellt ansvar och publiceringsbeslut
              ligger hos DivLab. AI-genererat material publiceras inte som
              oberoende faktakälla utan mänsklig granskning i den mån processen
              kräver det för respektive innehållstyp.
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
            </ul>
          </section>
        </div>
      </article>
    </MarketingPageShell>
  );
}
