import Link from "next/link";
import Dashboard from "./DashboardComponent";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-divlab-bg">
      <div className="pointer-events-none absolute left-[-250px] top-[300px] h-[600px] w-[600px] rounded-full bg-divlab-blue/5 blur-[180px]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-32 md:px-8 lg:grid-cols-2 lg:pb-0 lg:pt-24">
        <div>
          <p className="mb-8 inline-flex items-center gap-3 rounded-full border divlab-border-neutral divlab-inset px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-divlab-text-muted">
            <span className="h-2 w-2 rounded-full bg-divlab-blue" />
            Plattformen för seriösa investerare
          </p>

          <h1 className="text-5xl font-extrabold leading-none text-divlab-text md:text-7xl lg:text-8xl">
            <span className="block">Investera för</span>
            <span className="block text-divlab-text">framtiden.</span>
          </h1>

          <p className="mt-10 max-w-xl text-xl leading-9 text-divlab-text-secondary">
            Bygg ett stabilt kassaflöde genom långsiktiga investeringar
            i kvalitetsbolag som delar ut till sina ägare.
          </p>

          <div className="relative z-10 mt-12 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:items-start">
            <Link href="/login" className="divlab-btn-primary w-full px-8 py-4 text-lg sm:w-auto">
              Logga in
            </Link>

            <Link
              href="/register"
              className="py-1 text-center text-sm font-medium text-divlab-text-muted transition hover:text-divlab-blue-muted sm:text-left"
            >
              Skapa konto
            </Link>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 border-t divlab-border-neutral pt-8 text-sm text-divlab-text-secondary sm:grid-cols-3">
            <div>
              <p className="text-lg font-semibold text-divlab-text">10+ år</p>
              <p>Långsiktigt fokus</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-divlab-text">Data först</p>
              <p>Analys utan brus</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-divlab-text">AI-stöd</p>
              <p>Förstå portföljen</p>
            </div>
          </div>
        </div>

        <div className="hidden justify-end lg:flex">
          <div className="flex h-[650px] w-[650px] items-center justify-center rounded-3xl divlab-card p-5">
            <Dashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
