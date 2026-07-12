import Link from "next/link";
import Dashboard from "./DashboardComponent";

const valuePoints = [
  {
    title: "Marknaden i fokus",
    description: "Data, nyheter och överblick.",
  },
  {
    title: "Din portfölj",
    description: "Verktyg som hjälper dig förstå innehaven.",
  },
  {
    title: "Community",
    description: "Diskussioner med andra marknadsintresserade.",
  },
] as const;

export default function Hero() {
  return (
    <section className="relative bg-divlab-bg">
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-12 md:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-24">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            MARKNAD · VERKTYG · COMMUNITY
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.03em] text-divlab-text sm:text-5xl lg:text-6xl">
            <span className="block">Följ marknaden.</span>
            <span className="block">Förstå mer.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-divlab-text-secondary">
            Samla marknadsdata, portföljverktyg, börsnyheter, analyser och
            diskussioner på ett ställe.
          </p>

          <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="divlab-btn-primary w-full px-8 py-3.5 text-base sm:w-auto"
            >
              Skapa konto
            </Link>

            <Link
              href="/login"
              className="rounded-xl border divlab-border-neutral px-6 py-3.5 text-center text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text sm:text-left"
            >
              Logga in
            </Link>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-5 border-t divlab-border-neutral pt-8 sm:grid-cols-3">
            {valuePoints.map((point) => (
              <div key={point.title}>
                <p className="text-sm font-semibold text-divlab-text">
                  {point.title}
                </p>
                <p className="mt-1 text-sm text-divlab-text-secondary">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden justify-end lg:flex">
          <div
            className="flex w-full max-w-[560px] items-center justify-center rounded-2xl divlab-card p-5"
            aria-hidden="true"
          >
            <Dashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
