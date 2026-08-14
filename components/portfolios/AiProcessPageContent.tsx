import Link from "next/link";
import {
  MODEL_PORTFOLIO_PUBLIC_CATALOG,
  MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL,
} from "@/lib/model-portfolios/public";
import { MODEL_PORTFOLIO_TURNOVER_POLICY } from "@/lib/model-portfolios/engine/policy";

const stages = [
  {
    number: "1",
    title: "Data & nyheter",
    paragraphs: [
      "Varje handelsdag kör DivLab fyra schemalagda researchpass i svensk tid: 09:20 för Norden samt 15:50, 18:30 och 21:30 med fokus på USA. Syftet är att samla marknadsdata och relevant underlag från tillåtna källor innan varje förvaltare tar ställning.",
      "Datahämtningen är gemensam och kostnadskontrollerad: samma källor, cache och budgettak används för att hålla researchen inom fasta ramar. Därefter styrs det hämtade underlaget medvetet in i olika researchprofiler – inte som köpsignaler, utan som sök- och bevakningskapacitet inför nästa steg.",
      "Försiktig får etablerad kvalitets- och kärnkapacitet. Medelrisk får en bredare, balanserad bevakning. Högrisk får small/mid- och opportunitetskapacitet. Utdelning får inkomstinriktad kapacitet mot preferens- och D-aktier samt utdelande ETF:er. Befintliga innehav bevakas alltid, även när de inte skulle kvalificera som nya köp i dag. Cacheade kandidatpaket återanvänds när de fortfarande är färska (cirka två timmar).",
      "Det nordiska 09:20-passet använder inte EODHD. USA-passen kan endast som fallback hämta fundamentals via EODHD inom en hård daglig budget. Valfri Google-/nyhetsenrichment kan läggas till men får aldrig vara det enda underlaget.",
      "Saknad, stale eller otillräckligt verifierad data behandlas konservativt: systemet spekulerar inte fram saknade nyckeltal.",
    ],
  },
  {
    number: "2",
    title: "AI-analys",
    paragraphs: [
      "Varje förvaltare får ett eget relevant kandidat- och bevakningsurval från den gemensamma researchmotorn. De fyra portföljerna behöver därför varken analysera samma bolag eller komma fram till samma beslut.",
      "Befintliga innehav syns alltid för HOLD, SÄLJ eller MINSKA/OMVIKTA, även om de inte skulle kvalificera som nya köp i dag. AI:n föreslår KÖP, SÄLJ, MINSKA/OMVIKTA eller AVVAKTA (HOLD). Deterministisk verifiering är det som slutgiltigt avgör om en affär bokförs.",
      "Teknisk analys används som timing- och riskstöd. Den får aldrig ensam utgöra tesen bakom en affär. HOLD är ett fullvärdigt och ofta önskvärt utfall när signalerna inte är tillräckligt starka eller när courtage och friktion äter upp fördelen.",
      "AI:n lämnar endast strukturerade förslag. Den kan inte kringgå riskvalidatorn eller skriva portföljdata direkt.",
    ],
  },
  {
    number: "3",
    title: "Verifiering",
    paragraphs: [
      "Innan en modellaffär bokförs körs deterministiska kontroller. Evidensreferenser måste valideras; annars tvingas beslutet till HOLD. En affär behöver normalt nå minst 8 procent av portföljvärdet, så att systemet undviker meningslösa småaffärer.",
      "Varje mandat har egen kyltid per instrument: Försiktig 120 timmar, Medelrisk 72 timmar, Högrisk 24 timmar och Utdelning 96 timmar. Därtill gäller kassagränser, max andel i enskild position och max aktieandel enligt portföljens riskregler.",
      "Simulerad courtage på exakt 10 kronor räknas in. För utländska papper krävs giltig FX; saknad växelkurs stoppar settlement i stället för att anta 1,0.",
    ],
  },
  {
    number: "4",
    title: "Genomförande",
    paragraphs: [
      "Godkända förslag bokförs som simulerade modellaffärer – inte som riktiga mäklarordrar. Fills märks som SIMULATED och motiveringen sparas i den offentliga historiken.",
      "Avvisade försök lämnas inte som evigt ”föreslagna”. Om settlement misslyckas markeras beslutet som avvisat eller misslyckat. Utdelnings-/bolagshändelse-ingestion är fortfarande fail-closed tills en verifierad företags­aktion­skälla är inkopplad.",
    ],
  },
] as const;

export default function AiProcessPageContent() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="space-y-4">
        <p className="divlab-section-label text-divlab-blue-muted">AI-portföljer</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl">
          Så arbetar DivLabs AI-portföljer
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-divlab-text-secondary sm:text-base">
          DivLab använder fyra olika AI-förvaltare med fyra olika mål: Försiktig,
          Medelrisk, Högrisk och Utdelning. De delar kostnadseffektiv data- och
          säkerhetsinfrastruktur, men söker, filtrerar och handlar inte på samma sätt.
          Det här är allmän information om hur systemet fungerar i dag –
          inte personlig investeringsrådgivning och ingen garanti för avkastning.
        </p>
        <p className="text-sm text-divlab-text-muted">
          Portföljerna gick live den {MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL} och har
          därför fortfarande kort historik.
        </p>
      </header>

      <section className="space-y-8">
        {stages.map((stage) => (
          <article
            key={stage.number}
            className="border-t divlab-border-neutral pt-8 first:border-t-0 first:pt-0"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">
              Steg {stage.number}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
              {stage.title}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-divlab-text-secondary">
              {stage.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-6 sm:px-7">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-divlab-text">
          Fyra förvaltare, gemensam infrastruktur
        </h2>
        <p className="mt-3 text-sm leading-7 text-divlab-text-secondary">
          Förvaltarna delar datahämtning, säkerhetskontroller och simulerat
          genomförande. Det som skiljer dem är mål, sökpreferenser, bevakningsfilter
          och handelsdisciplin – inte fyra risketiketter på samma förvaltare.
        </p>
        <ul className="mt-5 space-y-4">
          {MODEL_PORTFOLIO_PUBLIC_CATALOG.map((portfolio) => {
            const policy = MODEL_PORTFOLIO_TURNOVER_POLICY[portfolio.strategyKey];
            return (
              <li key={portfolio.slug}>
                <Link
                  href={`/portfolios/${portfolio.slug}`}
                  className="font-semibold text-divlab-text transition hover:text-divlab-blue"
                >
                  {portfolio.name}
                </Link>
                <p className="mt-1 text-sm leading-6 text-divlab-text-secondary">
                  {portfolio.summary} Cooldown {policy.cooldownHours} timmar · minsta
                  affär {policy.minTradePctOfPortfolio}&nbsp;% av portföljen.
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-7 text-divlab-text-secondary">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-divlab-text">
          Vad som är offentligt
        </h2>
        <p>
          Offentliga beslutsförklaringar beskriver vilka bolag som undersökts, vad som
          vägde tyngst och varför AI:n föreslog KÖP, SÄLJ eller HOLD. Intern
          drifts­telemetri (cacheträffar, budgeträknare och liknande) sparas separat och
          ingår inte i den publika motiveringen.
        </p>
        <p>
          Modellportföljerna är simulerade. Historisk avkastning är kort eftersom
          strategierna är nyligen lanserade, och säger ingenting om framtida resultat.
          Förbättringar i förvaltningslogiken gäller kommande körningar och skriver
          inte om redan bokförda portföljbeslut.
        </p>
      </section>

      <div className="flex flex-col gap-3 border-t divlab-border-neutral pt-8 sm:flex-row sm:items-center">
        <Link
          href="/portfolios"
          className="divlab-btn-primary px-5 py-3 text-center text-sm font-semibold"
        >
          Till AI-portföljerna
        </Link>
        <Link
          href="/portfolios#historik"
          className="rounded-xl border divlab-border-neutral px-5 py-3 text-center text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text"
        >
          Se senaste affärer
        </Link>
      </div>
    </div>
  );
}
