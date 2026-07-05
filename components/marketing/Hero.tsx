import Dashboard from "./DashboardComponent";
import Logo from "./Logo";
import PrimaryButton from "../ui/Button";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#090909]">

      {/* Glow */}
      <div className="absolute left-[-250px] top-[300px] h-[600px] w-[600px] rounded-full bg-[#D4AF37]/10 blur-[180px]" />

      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-8">

        {/* LEFT SIDE */}
        <div className="w-full lg:w-1/2">

          <p className="mb-8 flex items-center gap-3 uppercase tracking-[0.25em] text-[#D4AF37]">
            ⭐ Plattformen för seriösa investerare
          </p>

          <h1 className="text-6xl font-extrabold leading-none lg:text-8xl">

            <span className="block text-white">
              Investera för
            </span>

            <span className="block bg-gradient-to-r from-[#F9D976] via-[#D4AF37] to-[#A67C00] bg-clip-text text-transparent">
              framtiden.
            </span>

          </h1>

          <p className="mt-10 max-w-xl text-xl leading-9 text-gray-400">

            Bygg ett stabilt kassaflöde genom långsiktiga investeringar
            i kvalitetsbolag som delar ut till sina ägare.

          </p>

          <div className="mt-12 flex gap-6">

            <PrimaryButton>
              Kom igång
            </PrimaryButton>

            <button className="rounded-xl border border-[#D4AF37]/40 px-8 py-4 text-lg transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10">
              ▶ Se demo
            </button>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="hidden lg:flex lg:w-1/2 justify-end">

          <div className="flex h-[650px] w-[650px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">

            <Dashboard />

          </div>

        </div>

      </div>

    </section>
  );
}