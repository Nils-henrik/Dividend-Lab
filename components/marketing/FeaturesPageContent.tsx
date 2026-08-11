import Link from "next/link";
import AppIcon from "@/components/layout/AppIcon";
import type { AppIconName } from "@/components/layout/AppIcon";

type FeatureMaturity = "Tillgängligt" | "Tidig version";

type FeatureItem = {
  icon: AppIconName;
  title: string;
  description: string;
  status: FeatureMaturity;
  href?: string;
  ctaLabel?: string;
};

const availableFeatures: FeatureItem[] = [
  {
    icon: "news",
    title: "Börsnyheter",
    status: "Tillgängligt",
    description:
      "Svenska börsnyheter och marknadsartiklar för allmän information — läsbara utan konto.",
  },
  {
    icon: "learning",
    title: "Utbildningsartiklar",
    status: "Tillgängligt",
    description:
      "Sakliga guider om aktier, fonder, privatekonomi, pension och FIRE – utan köpråd.",
  },
  {
    icon: "goals",
    title: "Frihetsmaskinen",
    status: "Tillgängligt",
    description:
      "Interaktiv FIRE-kalkylator för att utforska sparande, kapital och utdelningsantaganden. En modell för reflektion – inte prognos eller rådgivning.",
  },
  {
    icon: "portfolio",
    title: "AI-portföljer",
    status: "Tillgängligt",
    description:
      "Fyra publika AI-förvaltade modellportföljer med olika investeringsstrategier. Läs beslut, historik och hur AI används för aktieanalys – utan konto.",
    href: "/portfolios",
    ctaLabel: "Öppna AI-portföljerna",
  },
  {
    icon: "forum",
    title: "Forum och offentliga profiler",
    status: "Tillgängligt",
    description:
      "Läs trådar, kategorier och bolagssidor utan konto. Skapa inlägg, diskutera och besöka medlemsprofiler efter registrering.",
  },
  {
    icon: "messages",
    title: "Privata meddelanden",
    status: "Tillgängligt",
    description:
      "Skicka och ta emot meddelanden mellan medlemmar i en avskild konversationsyta efter inloggning.",
  },
  {
    icon: "dashboard",
    title: "Personlig DivLab-miljö",
    status: "Tidig version",
    description:
      "Startvyn efter inloggning ger en orienterande överblick med genvägar till nyheter, utbildning, Frihetsmaskinen och community.",
  },
  {
    icon: "calendar",
    title: "Kalender",
    status: "Tidig version",
    description:
      "Kalenderhubben samlar händelser och utdelningsrelaterad information i ett gränssnitt du kan utforska idag. Fler kopplingar utvecklas vidare.",
  },
];

const upcomingFeatures = [
  {
    status: "Under utveckling" as const,
    title: "DivBrain",
    description:
      "DivBrain utvecklas stegvis för att hjälpa användare att förstå marknaden, bolag och finansiella begrepp. Den första versionen byggs med tydliga källor, avgränsningar och kvalitetskontroller.",
  },
  {
    status: "Planerat" as const,
    title: "Bevakningslista",
    description:
      "En yta för att samla bolag och tillgångar du vill följa över tid – utan att bli ett handelsverktyg.",
  },
  {
    status: "Planerat" as const,
    title: "Portföljspårning",
    description:
      "Grundläggande portföljöversikt i allmän form – utan individuella köp- eller säljsignaler.",
  },
];

function StatusLabel({
  children,
  tone,
}: {
  children: string;
  tone: "available" | "early" | "development" | "planned";
}) {
  const className =
    tone === "available"
      ? "border-divlab-blue/30 bg-divlab-blue/10 text-divlab-blue-muted"
      : tone === "early"
        ? "border-white/15 bg-white/[0.05] text-divlab-text-secondary"
        : tone === "development"
          ? "border-white/10 bg-white/[0.04] text-divlab-text-secondary"
          : "border-white/10 bg-white/[0.02] text-divlab-text-muted";

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${className}`}
    >
      {children}
    </span>
  );
}

function FeatureCard({ icon, title, description, status, href, ctaLabel }: FeatureItem) {
  const statusTone = status === "Tillgängligt" ? "available" : "early";
  return (
    <article className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border divlab-border-neutral bg-white/[0.03] text-divlab-text-secondary">
          <AppIcon name={icon} className="h-4 w-4" />
        </span>
        <StatusLabel tone={statusTone}>{status}</StatusLabel>
      </div>
      <h3 className="mt-4 text-base font-semibold text-divlab-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
        {description}
      </p>
      {href ? (
        <Link
          href={href}
          className="mt-4 inline-flex text-sm font-semibold text-divlab-blue transition hover:text-divlab-blue-muted"
        >
          {ctaLabel ?? "Läs mer"} →
        </Link>
      ) : null}
    </article>
  );
}

function PageCtas() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link href="/register" className="divlab-btn-primary px-6 py-3 text-sm font-semibold">
        Skapa konto
      </Link>
      <Link
        href="/portfolios"
        className="rounded-xl border divlab-border-neutral px-6 py-3 text-center text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text"
      >
        Utforska AI-portföljerna
      </Link>
    </div>
  );
}

export default function FeaturesPageContent() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-20">
      <section>
        <p className="divlab-section-label">Funktioner</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-divlab-text md:text-4xl">
          Verktyg, kunskap och gemenskap för dig som följer marknaden.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-divlab-text-secondary">
          DivLab samlar marknadsöversikt, börsnyheter, utbildning och diskussion
          på en plats. Plattformen utvecklas steg för steg med fokus på tydlighet,
          verklig produktnytta och ett bättre sätt att följa finansmarknaden.
        </p>
        <div className="mt-8">
          <PageCtas />
        </div>
      </section>

      <section className="mt-16 border-t divlab-border-neutral pt-12">
        <h2 className="text-xl font-semibold text-divlab-text">Tillgängligt idag</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-divlab-text-muted">
          Funktioner du kan använda i plattformen nu. Omfattning varierar – vissa
          områden är fullt användbara, andra finns i en tidig version.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {availableFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="mt-16 border-t divlab-border-neutral pt-12">
        <h2 className="text-xl font-semibold text-divlab-text">På väg</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-divlab-text-muted">
          Riktning för nära framtid. Det här är inte färdig funktionalitet.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {upcomingFeatures.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-5"
            >
              <StatusLabel
                tone={
                  feature.status === "Under utveckling" ? "development" : "planned"
                }
              >
                {feature.status}
              </StatusLabel>
              <h3 className="mt-4 text-base font-semibold text-divlab-text">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 border-t divlab-border-neutral pt-12">
        <p className="max-w-3xl text-base leading-7 text-divlab-text-secondary">
          DivLab byggs steg för steg. Nya funktioner läggs till när de skapar
          tydlig nytta och håller den kvalitet vi vill att plattformen ska stå för.
        </p>
        <div className="mt-8">
          <PageCtas />
        </div>
      </section>
    </div>
  );
}
