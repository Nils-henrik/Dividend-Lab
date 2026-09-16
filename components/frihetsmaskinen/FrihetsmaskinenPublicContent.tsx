import Link from "next/link";
import FreedomPlanCard from "@/components/dashboard/FreedomPlanCard";
import FrihetsmaskinenInspirationSection from "@/components/frihetsmaskinen/FrihetsmaskinenInspirationSection";

type Props = {
  showAccountCta?: boolean;
};

export default function FrihetsmaskinenPublicContent({
  showAccountCta = true,
}: Props) {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="max-w-3xl space-y-5">
        <p className="divlab-section-label text-divlab-blue-muted">
          Gratis FIRE-kalkylator
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl lg:text-5xl lg:leading-[1.08]">
          Räkna på ekonomiskt oberoende
        </h1>
        <p className="text-lg leading-8 text-divlab-text-secondary">
          Frihetsmaskinen är DivLabs kalkylator för ekonomisk frihet. Se hur
          nuvarande kapital, månadssparande, avkastning och ditt mål påverkar
          tiden till större ekonomiskt oberoende. Kalkylatorn är gratis och
          kräver inget konto.
        </p>
      </header>

      <div id="kalkylator">
        <FreedomPlanCard />
      </div>

      <section
        aria-labelledby="frihetsmaskinen-how-heading"
        className="grid gap-6 border-y divlab-border-neutral py-8 md:grid-cols-3"
      >
        <div>
          <h2
            id="frihetsmaskinen-how-heading"
            className="text-sm font-semibold text-divlab-text"
          >
            Så fungerar FIRE-kalkylatorn
          </h2>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Ange ålder, kapital och månadssparande. Välj sedan om du vill räkna
            mot en viss månadsutdelning eller ett eget kapitalmål. Resultatet
            och kapitalgrafen uppdateras direkt när du ändrar ett värde.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-divlab-text">
            Vad påverkar tiden till målet?
          </h2>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Ett högre månadssparande eller större startkapital kan förkorta
            tidslinjen, medan ett högre kapitalmål kan förlänga den. Testa flera
            scenarier för att se vilka antaganden som gör störst skillnad.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-divlab-text">
            Viktigt att veta
          </h2>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Inflation, skatt, avgifter, marknadsavkastning och ändrade utgifter
            påverkar verkligheten. Beräkningen är en pedagogisk uppskattning —
            inte ett löfte om framtida avkastning eller när du kan sluta jobba.
          </p>
        </div>
      </section>

      <FrihetsmaskinenInspirationSection />

      <section
        aria-labelledby="frihetsmaskinen-learn-heading"
        className="rounded-xl border divlab-border-neutral bg-white/[0.02] px-5 py-6 md:px-6"
      >
        <h2
          id="frihetsmaskinen-learn-heading"
          className="text-lg font-semibold text-divlab-text"
        >
          Lär dig mer om ekonomisk frihet
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
          Kombinera kalkylen med DivLabs guider om FIRE, sparkvot, ränta på
          ränta och långsiktigt sparande.
        </p>
        <ul className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <li>
            <Link
              href="/learning/fire-ekonomisk-frihet"
              className="divlab-link text-sm font-medium underline decoration-divlab-blue/30 underline-offset-4"
            >
              Vad är FIRE och ekonomisk frihet?
            </Link>
          </li>
          <li>
            <Link
              href="/learning/sparkvot-budgetera-lonen-i-procent"
              className="divlab-link text-sm font-medium underline decoration-divlab-blue/30 underline-offset-4"
            >
              Sparkvot: budgetera lönen i procent
            </Link>
          </li>
          <li>
            <Link
              href="/learning/tid-till-ekonomisk-frihet"
              className="divlab-link text-sm font-medium underline decoration-divlab-blue/30 underline-offset-4"
            >
              Tid till ekonomisk frihet
            </Link>
          </li>
          <li>
            <Link
              href="/learning/ranta-pa-ranta"
              className="divlab-link text-sm font-medium underline decoration-divlab-blue/30 underline-offset-4"
            >
              Ränta på ränta
            </Link>
          </li>
          <li>
            <Link
              href="/learning/leva-pa-utdelningar-kapital"
              className="divlab-link text-sm font-medium underline decoration-divlab-blue/30 underline-offset-4"
            >
              Hur mycket kapital krävs för utdelningar?
            </Link>
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="frihetsmaskinen-tools-heading"
        className="flex flex-col gap-4 border-t divlab-border-neutral pt-8 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="divlab-section-label text-divlab-blue-muted">
            Fler verktyg
          </p>
          <h2
            id="frihetsmaskinen-tools-heading"
            className="mt-2 text-lg font-semibold text-divlab-text"
          >
            Räkna ut ditt GAV
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            Lägg in köp, courtage, försäljningar och split för att se ditt
            genomsnittliga anskaffningsvärde.
          </p>
        </div>
        <Link
          href="/verktyg/gav-kalkylator"
          className="divlab-btn-secondary min-h-11 shrink-0 px-5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          Öppna GAV-kalkylatorn
        </Link>
      </section>

      {showAccountCta ? (
        <section
          aria-labelledby="frihetsmaskinen-account-heading"
          className="border-t divlab-border-neutral pt-8"
        >
          <h2
            id="frihetsmaskinen-account-heading"
            className="text-xl font-semibold tracking-[-0.02em] text-divlab-text"
          >
            Fortsätt i din DivLab-miljö
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            Frihetsmaskinen fungerar utan konto. Skapa ett kostnadsfritt konto
            om du också vill använda forum, kommentarer, kontakter, meddelanden
            och din personliga DivLab-miljö.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register?redirect=/frihetsmaskinen"
              className="divlab-btn-primary inline-flex min-h-11 items-center justify-center px-6 py-3 text-sm font-semibold"
            >
              Skapa konto gratis
            </Link>
            <Link
              href="/login?redirect=/frihetsmaskinen"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-6 py-3 text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text"
            >
              Logga in
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
