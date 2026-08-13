import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";

type Feature = {
  icon: AppIconName;
  title: string;
  description: string;
  href: string;
  status?: string;
  linkLabel?: string;
};

const features: readonly Feature[] = [
  {
    icon: "news",
    title: "Börsnyheter",
    description:
      "Aktuella analyser och nyheter om marknaden, bolag och makro.",
    href: "/news",
  },
  {
    icon: "pieChart",
    title: "AI-portföljer",
    description:
      "Följ fyra AI-drivna modellportföljer med transparent historik.",
    href: "/portfolios",
  },
  {
    icon: "learning",
    title: "Utbildning",
    description:
      "Lättlästa guider om investeringar, sparande och privatekonomi.",
    href: "/learning",
  },
  {
    icon: "rocket",
    title: "Frihetsmaskinen",
    description:
      "Räkna på vägen mot ekonomisk frihet utifrån dina egna antaganden.",
    href: "/frihetsmaskinen",
  },
  {
    icon: "forum",
    title: "Forum",
    description:
      "Diskutera marknaden, ställ frågor och lär tillsammans med andra.",
    href: "/forum",
  },
  {
    icon: "brain",
    title: "DivBrain",
    description: "DivLabs AI-lager utvecklas vidare steg för steg.",
    href: "/features",
    status: "På väg",
    linkLabel: "Läs om DivBrain",
  },
];

export default function HomeFeatureGrid() {
  return (
    <section
      aria-labelledby="homepage-features-heading"
      className="border-t divlab-border-neutral bg-divlab-bg"
    >
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-14">
        <p className="divlab-section-label text-[10px] tracking-[0.22em]">
          Funktioner
        </p>
        <h2
          id="homepage-features-heading"
          className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl"
        >
          Det här får du med DivLab
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              aria-label={`${feature.title}: ${feature.linkLabel ?? "Läs mer"}`}
              className="group flex min-h-[11rem] flex-col rounded-xl border divlab-border-neutral bg-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-divlab-border-strong hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex shrink-0 text-[#168cff]"
                >
                  <AppIcon
                    name={feature.icon}
                    className="h-9 w-9"
                    strokeWidth={2.15}
                  />
                </span>
                {feature.status ? (
                  <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-violet-300">
                    {feature.status}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-divlab-text transition group-hover:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-[0.82rem] leading-[1.45] text-divlab-text-secondary">
                {feature.description}
              </p>
              <span className="mt-auto pt-4 text-xs font-semibold text-divlab-blue transition group-hover:text-divlab-blue-muted">
                {feature.linkLabel ?? "Läs mer"} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
