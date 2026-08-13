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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(0,132,255,0.13),transparent_34%),radial-gradient(circle_at_76%_12%,rgba(30,64,175,0.1),transparent_32%)]"
      />
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 md:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 lg:py-12 xl:gap-14">
        <div>
          <p className="divlab-section-label text-[10px] tracking-[0.22em]">
            DivLab
          </p>

          <h1 className="mt-4 max-w-[650px] text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-divlab-text sm:text-5xl lg:text-[clamp(3.1rem,3.4vw,3.55rem)]">
            <span className="block">Börsen. AI. Kunskap.</span>
            <span className="mt-1 block">Samlat på ett ställe.</span>
          </h1>

          <p className="mt-5 max-w-[560px] text-base leading-7 text-divlab-text-secondary">
            Följ marknaden, se hur DivLabs AI-portföljer agerar och lär dig mer
            om investeringar och privatekonomi. Skapa ett gratis konto och bygg
            din egen DivLab-miljö.
          </p>

          <div className="mt-6 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center">
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

          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-0">
            {valuePoints.map((point, index) => (
              <div
                key={point.title}
                className={`flex items-start gap-3 sm:px-5 ${
                  index === 0 ? "sm:pl-0" : "sm:border-l sm:border-white/10"
                } ${index === valuePoints.length - 1 ? "sm:pr-0" : ""}`}
              >
                <span
                  className="mt-0.5 inline-flex shrink-0 text-[#168cff]"
                  aria-hidden="true"
                >
                  <AppIcon
                    name={point.icon}
                    className="h-7 w-7"
                    strokeWidth={2}
                  />
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
          <div className="w-full max-w-[700px] rounded-2xl border border-white/[0.11] bg-[rgba(9,17,29,0.9)] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-5">
            <Suspense fallback={<ProductPreviewPanelFallback />}>
              <HomePortfolioPreviewPanel />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
