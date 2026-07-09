import Link from "next/link";
import Dashboard from "./DashboardComponent";

const primaryButtonClasses =
  "inline-flex items-center justify-center rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-8 py-4 text-lg font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.18)] transition-all duration-300 hover:bg-[#F5D77A] hover:shadow-[0_0_40px_rgba(212,175,55,0.28)]";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#090909]">
      <div className="pointer-events-none absolute left-[-250px] top-[300px] h-[600px] w-[600px] rounded-full bg-[#D4AF37]/10 blur-[180px]" />
      <div className="pointer-events-none absolute right-[-220px] top-[-180px] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/5 blur-[160px]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-32 md:px-8 lg:grid-cols-2 lg:pb-0 lg:pt-24">
        <div>
          <p className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.8)]" />
            Plattformen för seriösa investerare
          </p>

          <h1 className="text-5xl font-extrabold leading-none text-white md:text-7xl lg:text-8xl">
            <span className="block">Investera för</span>

            <span className="block bg-gradient-to-r from-[#F9D976] via-[#D4AF37] to-[#A67C00] bg-clip-text text-transparent">
              framtiden.
            </span>
          </h1>

          <p className="mt-10 max-w-xl text-xl leading-9 text-gray-400">
            Bygg ett stabilt kassaflöde genom långsiktiga investeringar
            i kvalitetsbolag som delar ut till sina ägare.
          </p>

          <div className="relative z-10 mt-12 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:items-start">
            <Link
              href="/login"
              className={`${primaryButtonClasses} w-full sm:w-auto`}
            >
              Logga in
            </Link>

            <Link
              href="/register"
              className="py-1 text-center text-sm font-medium text-gray-400 transition hover:text-[#D4AF37] sm:text-left"
            >
              Skapa konto
            </Link>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 border-t border-white/10 pt-8 text-sm text-gray-400 sm:grid-cols-3">
            <div>
              <p className="text-lg font-semibold text-white">10+ år</p>
              <p>Långsiktigt fokus</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Data först</p>
              <p>Analys utan brus</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">AI-stöd</p>
              <p>Förstå portföljen</p>
            </div>
          </div>
        </div>

        <div className="hidden justify-end lg:flex">
          <div className="flex h-[650px] w-[650px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <Dashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
