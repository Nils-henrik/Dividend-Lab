import type { Metadata } from "next";
import Link from "next/link";
import GavCalculator from "@/components/gav/GavCalculator";
import PublicContentShell from "@/components/layout/PublicContentShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { breadcrumbJsonLd, webApplicationJsonLd } from "@/lib/seo/json-ld";

const title = "GAV-kalkylator – räkna ut GAV på aktier | DivLab";
const description =
  "Räkna ut GAV på aktier och fonder med courtage, försäljningar och split. Se ditt snittpris, omkostnadsbelopp och hur nya köp påverkar GAV.";

const taxAgencyCostBasisUrl =
  "https://www.skatteverket.se/privat/skatter/vardepapper/deklareraaktierochovrigavardepapper/omkostnadsbelopp.4.12815e4f14a62bc048fa7bc.html";
const taxAgencyCalculatorUrl =
  "https://skatteverket.se/privat/skatter/vardepapper/deklareraaktierochovrigavardepapper/berakningshjalpforomkostnadsbelopp.4.4a4d586616058d860bc564c.html";
const taxAgencyShareHistoryUrl =
  "https://skatteverket.se/privat/skatter/vardepapper/aktiehistorik";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    "GAV-kalkylator",
    "räkna ut GAV",
    "genomsnittligt anskaffningsvärde",
    "genomsnittligt omkostnadsbelopp",
    "GAV aktier",
    "GAV fonder",
    "courtage",
    "snitta ner",
    "mål-GAV",
    "K4",
  ],
  alternates: {
    canonical: getCanonicalUrl("/verktyg/gav-kalkylator"),
  },
  openGraph: {
    title,
    description,
    url: getCanonicalUrl("/verktyg/gav-kalkylator"),
    type: "website",
    locale: "sv_SE",
  },
};

const articleHeadingClass =
  "text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl";
const paragraphClass = "text-base leading-8 text-divlab-text-secondary";
const articleLinkClass =
  "divlab-link font-medium underline decoration-divlab-blue/30 underline-offset-4";

export default async function GavCalculatorPage() {
  const user = await getAuthenticatedUser();

  return (
    <PublicContentShell>
      <JsonLdScript
        data={[
          webApplicationJsonLd({
            name: "GAV-kalkylator",
            description,
            path: "/verktyg/gav-kalkylator",
          }),
          breadcrumbJsonLd([
            { name: "Hem", path: "/" },
            { name: "Verktyg", path: "/verktyg" },
            {
              name: "GAV-kalkylator",
              path: "/verktyg/gav-kalkylator",
            },
          ]),
        ]}
      />

      <main className="gav-page mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="gav-screen-content max-w-4xl space-y-5">
          <p className="divlab-section-label text-divlab-blue-muted">
            Investeringsverktyg
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl lg:text-5xl lg:leading-[1.08]">
            GAV-kalkylator – räkna ut genomsnittligt anskaffningsvärde
          </h1>
          <p className="text-lg leading-8 text-divlab-text-secondary">
            Lägg in dina köp, försäljningar och eventuella aktiesplittar.
            Kalkylatorn räknar ut ditt aktuella GAV, totala omkostnadsbelopp
            och hur nya affärer påverkar innehavet.
          </p>
          <p className="text-sm leading-6 text-divlab-text-muted">
            <Link href="/verktyg" className={articleLinkClass}>
              Se alla DivLabs verktyg
            </Link>
          </p>
        </header>

        <section
          aria-labelledby="gav-introduction-heading"
          className="gav-screen-content grid gap-5 border-y divlab-border-neutral py-8 md:grid-cols-3"
        >
          <h2 id="gav-introduction-heading" className="sr-only">
            Om GAV-kalkylatorn
          </h2>
          <div>
            <h3 className="text-sm font-semibold text-divlab-text">
              Vad verktyget räknar
            </h3>
            <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
              Köp, courtage, försäljningar, split och omvänd split behandlas i
              den ordning du anger dem.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-divlab-text">
              Vad GAV betyder
            </h3>
            <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
              GAV är det genomsnittliga anskaffningsvärdet per aktie eller
              fondandel. Skatteverket använder begreppet genomsnittligt
              omkostnadsbelopp.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-divlab-text">
              Viktig avgränsning
            </h3>
            <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
              Beräkningen gäller ett värdepapper av samma slag och sort.
              Blanda inte exempelvis A- och B-aktier i samma kalkyl.
            </p>
          </div>
        </section>

        <GavCalculator />

        <aside className="gav-screen-content rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-5 sm:p-6">
          <h2 className="text-base font-semibold text-divlab-text">
            Företagshändelser som behöver kontrolleras
          </h2>
          <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
            Vissa företagshändelser kräver att omkostnadsbeloppet fördelas
            enligt Skatteverkets beslut. Kontrollera alltid bolaget i{" "}
            <a
              href={taxAgencyShareHistoryUrl}
              className={articleLinkClass}
              rel="noopener noreferrer"
            >
              Skatteverkets Aktiehistorik
            </a>{" "}
            innan du använder resultatet i en deklaration. Kalkylatorn
            hanterar inte exempelvis split med inlösen, avknoppning,
            fusion, återbetalning av kapital, rättigheter eller kontant
            ersättning för överskjutande aktier. En betald nyemission kan
            normalt registreras som ett köp med teckningspris och eventuell
            avgift, men andra rättighetsrelaterade händelser måste bedömas
            separat.
          </p>
        </aside>

        <article className="gav-screen-content mx-auto max-w-4xl space-y-12">
          <section aria-labelledby="what-is-gav">
            <h2 id="what-is-gav" className={articleHeadingClass}>
              Vad är GAV?
            </h2>
            <div className="mt-5 space-y-4">
              <p className={paragraphClass}>
                GAV betyder genomsnittligt anskaffningsvärde och beskriver
                vad varje aktie eller fondandel i ett innehav i genomsnitt
                har kostat att anskaffa. I Skatteverkets information används
                oftast uttrycket genomsnittligt omkostnadsbelopp per styck.
                Orden används något olika i vardagen, men pekar här på samma
                grundidé: innehavets sammanlagda omkostnadsbelopp fördelat på
                antalet enheter.
              </p>
              <p className={paragraphClass}>
                GAV kan hjälpa dig förstå din position, men säger inte om ett
                värdepapper är billigt, dyrt eller lämpligt att köpa. För
                värdepapper på ett traditionellt aktie- och fondkonto är
                omkostnadsbeloppet dessutom relevant när vinst eller förlust
                på sålda andelar ska beräknas. Läs Skatteverkets aktuella
                beskrivning av{" "}
                <a
                  href={taxAgencyCostBasisUrl}
                  className={articleLinkClass}
                  rel="noopener noreferrer"
                >
                  genomsnittsmetoden och omkostnadsbelopp
                </a>{" "}
                innan du deklarerar.
              </p>
            </div>
          </section>

          <section aria-labelledby="calculate-gav">
            <h2 id="calculate-gav" className={articleHeadingClass}>
              Så räknar du ut GAV
            </h2>
            <div className="mt-5 space-y-4">
              <p className="rounded-xl border divlab-border-neutral bg-white/[0.02] px-5 py-4 text-base font-semibold text-divlab-text">
                GAV = totalt omkostnadsbelopp ÷ antal aktier eller
                fondandelar
              </p>
              <p className={paragraphClass}>
                Beräkningen måste vara viktad. Ett enkelt medelvärde av
                köppriserna blir fel när köpen omfattar olika antal. Om du
                köper 10 aktier för 100 kronor och sedan 20 aktier för 50
                kronor är det enkla medelvärdet 75 kronor. Det tar dock inte
                hänsyn till att dubbelt så många aktier köptes till det lägre
                priset. Totalkostnaden är 2&nbsp;000 kronor och antalet är 30,
                vilket ger ett GAV på 66,67 kronor före courtage.
              </p>
              <p className={paragraphClass}>
                Behåll full precision genom alla steg. Om ett visat GAV
                avrundas och återanvänds vid nästa försäljning kan små
                differenser växa genom en lång transaktionshistorik.
                Kalkylatorn räknar därför vidare med fler decimaler än vad som
                normalt visas.
              </p>
            </div>
          </section>

          <section aria-labelledby="brokerage-gav">
            <h2 id="brokerage-gav" className={articleHeadingClass}>
              Ska courtage räknas med?
            </h2>
            <div className="mt-5 space-y-4">
              <p className={paragraphClass}>
                Ja, courtage vid köp ingår i anskaffningsutgiften och höjer
                därmed det totala omkostnadsbeloppet. Ett köp av 10 aktier för
                100 kronor med 9 kronor i courtage kostar sammanlagt
                1&nbsp;009 kronor. Det är detta belopp som läggs till
                innehavets kostnadsbas.
              </p>
              <p className={paragraphClass}>
                Courtage vid försäljning behandlas annorlunda. Det minskar
                försäljningsersättningen och därmed det realiserade
                resultatet. Det ska inte läggas till eller dras av från GAV
                för de andelar som fortfarande finns kvar.
              </p>
            </div>
          </section>

          <section aria-labelledby="sale-gav">
            <h2 id="sale-gav" className={articleHeadingClass}>
              Vad händer med GAV när du säljer?
            </h2>
            <div className="mt-5 space-y-4">
              <p className={paragraphClass}>
                En partiell försäljning ändrar inte i sig GAV per kvarvarande
                enhet. De sålda enheterna får ett omkostnadsbelopp baserat på
                det GAV som gällde omedelbart före försäljningen. Samma belopp
                tas bort från innehavets totala kostnadsbas.
              </p>
              <p className={paragraphClass}>
                Om GAV är 67,60 kronor och 12 av 30 aktier säljs tas
                811,20 kronor bort från omkostnadsbeloppet. De 18 återstående
                aktierna har fortfarande 67,60 kronor i GAV. Säljs hela
                innehavet blir både antal och kvarvarande omkostnadsbelopp
                noll; ett aktuellt GAV finns då inte längre.
              </p>
            </div>
          </section>

          <section aria-labelledby="split-gav">
            <h2 id="split-gav" className={articleHeadingClass}>
              GAV vid split och omvänd split
            </h2>
            <div className="mt-5 space-y-4">
              <p className={paragraphClass}>
                Vid en vanlig split ökar antalet aktier medan det totala
                omkostnadsbeloppet normalt är oförändrat. En split där varje
                gammal aktie blir fyra nya gör därför antalet fyra gånger så
                stort och GAV per aktie en fjärdedel så högt. Vid en omvänd
                split sker motsatsen: flera gamla aktier läggs samman till
                färre nya och GAV per aktie stiger i motsvarande grad.
              </p>
              <p className={paragraphClass}>
                Alla bolagshändelser är inte så enkla. Inlösen,
                avknoppningar, fusioner och tilldelning av andra värdepapper
                kan kräva en särskild fördelning av omkostnadsbeloppet. Sök
                alltid upp bolagets villkor i Aktiehistorik och jämför med
                avräkningsnotor och bolagets information.
              </p>
            </div>
          </section>

          <section aria-labelledby="account-types-gav">
            <h2 id="account-types-gav" className={articleHeadingClass}>
              GAV på ISK, kapitalförsäkring och aktie- och fondkonto
            </h2>
            <div className="mt-5 space-y-4">
              <p className={paragraphClass}>
                På ett investeringssparkonto deklareras enskilda vinster och
                förluster normalt inte affär för affär, eftersom kontot
                schablonbeskattas. En kapitalförsäkring har en egen
                skatterättslig struktur och försäkringsbolaget är den
                formella ägaren av tillgångarna. GAV kan ändå vara användbart
                på båda kontoformerna för att följa vad innehavet har kostat.
              </p>
              <p className={paragraphClass}>
                På ett traditionellt aktie- och fondkonto, ofta kallat depå,
                är omkostnadsbeloppet relevant när resultatet för sålda
                värdepapper räknas fram. Kontrollera alltid vilken kontotyp du
                faktiskt har och vilka aktuella regler som gäller hos din
                mäklare och Skatteverket. DivLabs{" "}
                <Link
                  href="/learning/borja-investera-pa-borsen"
                  className={articleLinkClass}
                >
                  guide för dig som vill börja investera
                </Link>{" "}
                beskriver kontoformerna i ett bredare sammanhang.
              </p>
            </div>
          </section>

          <section aria-labelledby="common-gav-errors">
            <h2 id="common-gav-errors" className={articleHeadingClass}>
              Vanliga fel när man räknar GAV
            </h2>
            <ul className="mt-5 grid gap-3 text-base leading-7 text-divlab-text-secondary sm:grid-cols-2">
              <li className="rounded-xl border divlab-border-neutral p-4">
                Att ta ett enkelt genomsnitt av köppriser i stället för ett
                viktat genomsnitt.
              </li>
              <li className="rounded-xl border divlab-border-neutral p-4">
                Att glömma courtage och andra direkta anskaffningsutgifter vid
                köp.
              </li>
              <li className="rounded-xl border divlab-border-neutral p-4">
                Att blanda exempelvis A- och B-aktier eller olika
                andelsklasser.
              </li>
              <li className="rounded-xl border divlab-border-neutral p-4">
                Att ändra GAV för kvarvarande aktier enbart på grund av en
                partiell försäljning.
              </li>
              <li className="rounded-xl border divlab-border-neutral p-4">
                Att missa split eller en annan företagshändelse som påverkar
                antal eller kostnadsfördelning.
              </li>
              <li className="rounded-xl border divlab-border-neutral p-4">
                Att återanvända avrundade mellanresultat i nästa steg.
              </li>
              <li className="rounded-xl border divlab-border-neutral p-4 sm:col-span-2">
                Att blanda valutor utan korrekt omräkning. Kalkylatorn
                hanterar endast värden som redan är uttryckta i SEK och gör
                ingen automatisk valutakonvertering.
              </li>
            </ul>
          </section>

          <section aria-labelledby="gav-faq">
            <h2 id="gav-faq" className={articleHeadingClass}>
              Vanliga frågor
            </h2>
            <div className="mt-5 divide-y divide-white/[0.08] border-y divlab-border-neutral">
              {[
                [
                  "Vad betyder GAV?",
                  "GAV betyder genomsnittligt anskaffningsvärde: innehavets totala omkostnadsbelopp delat med antalet aktier eller fondandelar.",
                ],
                [
                  "Hur räknar man ut GAV efter flera köp?",
                  "Lägg ihop anskaffningsutgifterna inklusive köpcourtage och dela summan med det totala antalet. Använd inte ett enkelt genomsnitt av köppriserna.",
                ],
                [
                  "Ska courtage ingå i GAV?",
                  "Köpcourtage ingår i anskaffningsutgiften. Försäljningscourtage minskar försäljningsersättningen men ändrar inte GAV för det kvarvarande innehavet.",
                ],
                [
                  "Ändras GAV när jag säljer aktier?",
                  "Inte vid en vanlig partiell försäljning. Kostnadsbasen minskar proportionellt och GAV per kvarvarande aktie är oförändrat.",
                ],
                [
                  "Vad händer med GAV vid en aktiesplit?",
                  "Antalet aktier ändras medan det totala omkostnadsbeloppet normalt är oförändrat. GAV per aktie ändras därför omvänt mot antalet.",
                ],
                [
                  "Behöver jag räkna GAV på ISK eller kapitalförsäkring?",
                  "Inte normalt för en transaktionsvis deklaration, men GAV kan fortfarande vara användbart för egen uppföljning. Kontrollera villkoren för din kontoform.",
                ],
                [
                  "Kan jag använda resultatet i min K4?",
                  "Använd resultatet som kontroll- och beräkningshjälp, inte som en färdig K4. Stäm av mot underlag, företagshändelser och Skatteverkets aktuella regler.",
                ],
              ].map(([question, answer]) => (
                <div key={question} className="py-5">
                  <h3 className="text-base font-semibold text-divlab-text">
                    {question}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                    {answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="gav-sources-heading"
            className="rounded-2xl border divlab-border-neutral bg-white/[0.02] p-5 sm:p-6"
          >
            <h2
              id="gav-sources-heading"
              className="text-lg font-semibold text-divlab-text"
            >
              Kontrollera underlag och officiell information
            </h2>
            <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
              Jämför kalkylen med avräkningsnotor, depåutdrag och bolagets
              meddelanden. Skatteverket har även en egen{" "}
              <a
                href={taxAgencyCalculatorUrl}
                className={articleLinkClass}
                rel="noopener noreferrer"
              >
                beräkningshjälp för omkostnadsbelopp
              </a>
              . Där behöver händelserna också registreras i tidsföljd och
              varje aktieslag beräknas separat.
            </p>
          </section>

          <section
            aria-labelledby="gav-disclaimer-heading"
            className="border-t divlab-border-neutral pt-8"
          >
            <h2
              id="gav-disclaimer-heading"
              className="text-lg font-semibold text-divlab-text"
            >
              Viktig information
            </h2>
            <p className="mt-3 text-sm leading-7 text-divlab-text-secondary">
              GAV-kalkylatorn är ett hjälpmedel och utgör inte
              investeringsrådgivning, skatterådgivning eller ett officiellt
              deklarationsunderlag. Kontrollera alltid uppgifterna mot
              avräkningsnotor, kontoutdrag, företagshändelser och aktuell
              information från Skatteverket. Läs även DivLabs{" "}
              <Link href="/disclaimer" className={articleLinkClass}>
                fullständiga ansvarsfriskrivning
              </Link>
              .
            </p>
          </section>

          <section
            aria-labelledby="gav-learn-heading"
            className="rounded-2xl border divlab-border-neutral p-5 sm:p-6"
          >
            <h2
              id="gav-learn-heading"
              className="text-lg font-semibold text-divlab-text"
            >
              Fördjupa dina kunskaper
            </h2>
            <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
              Fortsätt i DivLabs{" "}
              <Link href="/learning" className={articleLinkClass}>
                utbildningsbibliotek
              </Link>{" "}
              eller börja med guiderna{" "}
              <Link
                href="/learning/vad-ar-en-aktie"
                className={articleLinkClass}
              >
                Vad är en aktie?
              </Link>{" "}
              och{" "}
              <Link
                href="/learning/vad-ar-en-indexfond"
                className={articleLinkClass}
              >
                Vad är en indexfond?
              </Link>
              .
            </p>
          </section>

          <section
            aria-labelledby="gav-freedom-heading"
            className="divlab-card p-5 sm:p-6"
          >
            <p className="divlab-section-label text-divlab-blue-muted">
              Fler verktyg
            </p>
            <h2
              id="gav-freedom-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.02em] text-divlab-text"
            >
              Planera nästa steg med Frihetsmaskinen
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
              När du har koll på dina innehav kan Frihetsmaskinen hjälpa dig
              räkna på hur sparande, avkastning och utgifter påverkar vägen
              mot ekonomisk frihet.
            </p>
            <Link
              href="/frihetsmaskinen"
              className="divlab-btn-primary mt-5 min-h-11 px-5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
            >
              Öppna Frihetsmaskinen
            </Link>
          </section>

          {!user ? (
            <section
              aria-labelledby="gav-account-heading"
              className="border-t divlab-border-neutral pt-8"
            >
              <h2
                id="gav-account-heading"
                className="text-xl font-semibold tracking-[-0.02em] text-divlab-text"
              >
                Fortsätt i din DivLab-miljö
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
                GAV-kalkylatorn fungerar utan konto. Skapa ett konto om du
                även vill delta i forumet och använda DivLabs övriga
                medlemsfunktioner.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register?redirect=/verktyg/gav-kalkylator"
                  className="divlab-btn-primary min-h-11 px-6 py-3"
                >
                  Skapa konto
                </Link>
                <Link
                  href="/login?redirect=/verktyg/gav-kalkylator"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-6 py-3 text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                >
                  Logga in
                </Link>
              </div>
            </section>
          ) : null}
        </article>
      </main>
    </PublicContentShell>
  );
}
