import Link from "next/link";

const principles = [
  {
    title: "Tydlighet",
    description:
      "Finansiell information och verktyg ska vara begripliga och lugnt presenterade – utan onödigt brus eller överdriven komplexitet.",
  },
  {
    title: "Lärande",
    description:
      "DivLab ska hjälpa dig bygga förståelse över tid genom utbildning, sammanhang och transparenta källor.",
  },
  {
    title: "Gemenskap",
    description:
      "Forumet ska stödja respektfulla diskussioner där medlemmar kan utbyta perspektiv, ställa frågor och dela kunskap.",
  },
] as const;

export default function AboutPageContent() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-20">
      <section>
        <p className="divlab-section-label">Om DivLab</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-divlab-text md:text-4xl">
          För dig som följer marknaden.
        </h1>
        <p className="mt-4 text-base leading-7 text-divlab-text-secondary">
          DivLab är en svensk plattform för människor som vill följa, förstå och
          diskutera finansmarknaden. Här samlas verktyg, utbildning,
          marknadsinformation och gemenskap i en tydlig och modern miljö.
        </p>
      </section>

      <section className="mt-12 space-y-4 text-sm leading-7 text-divlab-text-secondary">
        <h2 className="text-xl font-semibold text-divlab-text">Vad DivLab är</h2>
        <p>
          DivLab samlar intresseområden som aktier, fonder, ETF:er, portföljer,
          utdelningar, trading, marknadsdata, utbildning och diskussion. Plattformen
          är byggd för dig som följer marknaden brett – inte enbart för ett enskilt
          investeringsperspektiv.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-divlab-text">Vad vi står för</h2>
        <div className="mt-6 space-y-5">
          {principles.map((principle) => (
            <article
              key={principle.title}
              className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-5"
            >
              <h3 className="text-base font-semibold text-divlab-text">
                {principle.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                {principle.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4 text-sm leading-7 text-divlab-text-secondary">
        <h2 className="text-xl font-semibold text-divlab-text">Vår vision</h2>
        <p>
          Visionen är att DivLab ska bli en plats man återkommer till för att följa
          marknaden, lära sig mer, använda praktiska verktyg och diskutera med andra.
          Plattformen byggs steg för steg, med fokus på verklig produktnytta och
          långsiktig kvalitet.
        </p>
      </section>

      <section className="mt-12 space-y-4 text-sm leading-7 text-divlab-text-secondary">
        <h2 className="text-xl font-semibold text-divlab-text">Framtiden</h2>
        <p>
          DivLab fortsätter utvecklas med bättre marknadsverktyg, mer utbildning,
          DivBrain i kontrollerade steg, starkare portfölj- och analysfunktioner samt
          en mer användbar community. Det som beskrivs här är riktning – inte en
          lista över färdig funktionalitet.
        </p>
      </section>

      <section className="mt-12 rounded-lg border divlab-border-neutral bg-white/[0.02] p-5">
        <p className="text-sm leading-6 text-divlab-text-secondary">
          DivLab erbjuder information, verktyg och utbildningsinnehåll – inte
          personlig finansiell rådgivning eller individuella köp- och
          säljrekommendationer.
        </p>
      </section>

      <section className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/register" className="divlab-btn-primary px-6 py-3 text-sm font-semibold">
          Skapa konto
        </Link>
        <Link
          href="/forum"
          className="rounded-xl border divlab-border-neutral px-6 py-3 text-center text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text"
        >
          Besök forumet
        </Link>
      </section>
    </div>
  );
}
