import { Suspense } from "react";
import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";
import HomePortfolioPreviewPanel from "./HomePortfolioPreviewPanel";
import ProductPreviewPanelFallback from "./ProductPreviewPanelFallback";

const valuePoints: ReadonlyArray<{
  icon: AppIconName;
  title: string;
  description: string;
}> = [
  {
    icon: "chart",
    title: "4 AI-portföljer",
    description: "Försiktig, Medelrisk, Högrisk och Utdelning.",
  },
  {
    icon: "shield",
    title: "Transparenta beslut",
    description: "Se analyser, affärer och historik.",
  },
  {
    icon: "gift",
    title: "Gratis beta",
    description: "Nyheter, verktyg och community på samma plats.",
  },
] as const;

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-divlab-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.11),_transparent_58%)]"
      />
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-12 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:pb-24 lg:pt-20">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-divlab-blue-muted">
            DivLab
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-divlab-text sm:text-5xl lg:text-[3.55rem]">
            <span className="block">Börsen. AI. Kunskap.</span>
            <span className="mt-1 block">Samlat på ett ställe.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-divlab-text-secondary sm:text-lg sm:leading-8">
            Följ marknaden, se hur DivLabs AI-portföljer agerar och lär dig mer
            om investeringar och privatekonomi. Skapa ett gratis konto och bygg
            din egen DivLab-miljö.
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="divlab-btn-primary inline-flex min-h-12 w-full items-center justify-center px-8 py-3.5 text-base font-semibold sm:w-auto"
            >
              Skapa gratis konto
            </Link>

            <Link
              href="/portfolios"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border divlab-border-neutral px-6 py-3.5 text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 sm:w-auto"
            >
              Utforska AI-portföljerna
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 border-t divlab-border-neutral pt-7 sm:grid-cols-3">
            {valuePoints.map((point) => (
              <div key={point.title} className="flex gap-3 sm:block">
                <span
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-divlab-blue/20 bg-divlab-blue/[0.08] text-divlab-blue sm:mb-3"
                  aria-hidden="true"
                >
                  <AppIcon name={point.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-divlab-text">
                    {point.title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-divlab-text-secondary">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full justify-center lg:justify-end">
          <div className="w-full max-w-[650px] rounded-2xl border divlab-border-neutral bg-white/[0.025] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-5">
            <Suspense fallback={<ProductPreviewPanelFallback />}>
              <HomePortfolioPreviewPanel />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
