import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";

type Feature = {
  icon: AppIconName;
  title: string;
  description: string;
  href: string;
};

const features: readonly Feature[] = [
  { icon: "news", title: "Börsnyheter", description: "Aktuella analyser och nyheter om marknaden, bolag och makro.", href: "/news" },
  { icon: "learning", title: "Utbildning", description: "Lättlästa guider om investeringar, sparande och privatekonomi.", href: "/learning" },
  { icon: "rocket", title: "Frihetsmaskinen", description: "Räkna på vägen mot ekonomisk frihet utifrån dina egna antaganden.", href: "/frihetsmaskinen" },
  { icon: "forum", title: "Forum", description: "Diskutera marknaden, ställ frågor och lär tillsammans med andra.", href: "/forum" },
  { icon: "dashboard", title: "Verktyg", description: "Kalkylatorer och verktyg som hjälper dig att förstå ditt sparande bättre.", href: "/verktyg" },
  { icon: "pieChart", title: "AI-portföljer", description: "Följ DivLabs öppna experiment med fyra publika modellportföljer.", href: "/portfolios" },
];

export default function FinanceFirstFeatureGrid() {
  return (
    <section aria-labelledby="homepage-features-heading" className="border-t divlab-border-neutral bg-divlab-bg">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-14">
        <p className="divlab-section-label text-[10px] tracking-[0.22em]">Funktioner</p>
        <h2 id="homepage-features-heading" className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl">Det här finns på DivLab</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href} aria-label={`${feature.title}: Läs mer`} className="group flex min-h-[10.5rem] flex-col rounded-xl border divlab-border-neutral bg-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-divlab-border-strong hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40">
              <div className="flex items-center gap-2.5">
                <AppIcon name={feature.icon} className="h-8 w-8 shrink-0 text-divlab-blue" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold leading-snug text-divlab-text transition group-hover:text-white">{feature.title}</h3>
              </div>
              <p className="mt-3 text-[0.82rem] leading-[1.45] text-divlab-text-secondary">{feature.description}</p>
              <span className="mt-auto pt-4 text-xs font-semibold text-divlab-blue transition group-hover:text-divlab-blue-muted">Läs mer →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
