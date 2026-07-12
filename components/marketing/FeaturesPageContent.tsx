import Link from "next/link";
import AppIcon from "@/components/layout/AppIcon";
import type { AppIconName } from "@/components/layout/AppIcon";

type FeatureMaturity = "Tillgängligt" | "Tidig version";

type FeatureItem = {
  icon: AppIconName;
  title: string;
  description: string;
  status: FeatureMaturity;
};

const availableFeatures: FeatureItem[] = [
  {
    icon: "dashboard",
    title: "Marknadsöversikt",
    status: "Tidig version",
    description:
      "Startvyn efter inloggning ger en orienterande överblick med utvalda index, aktuella rubriker i Marknadspuls och vägar vidare till andra delar av plattformen.",
  },
  {
    icon: "news",
    title: "Börsnyheter",
    status: "Tidig version",
    description:
      "En första version av DivLabs samlade nyhetsyta. Funktionen utvecklas vidare mot ett löpande och tydligare nyhetsflöde för finansmarknaden.",
  },
  {
    icon: "learning",
    title: "Utbildningsartiklar",
    status: "Tillgängligt",
    description:
      "Sakliga artiklar som hjälper dig bygga förståelse kring marknaden, bolag och centrala begrepp – utan köpråd.",
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
    icon: "calendar",
    title: "Kalender",
    status: "Tidig version",
    description:
      "Kalenderhubben samlar händelser och utdelningsrelaterad information i ett gränssnitt du kan utforska idag. Koppling till verkliga portföljdata och fler marknadshändelser utvecklas vidare.",
  },
  {
    icon: "goals",
    title: "Frihetsplan",
    status: "Tidig version",
    description:
      "Interaktivt planeringsverktyg för att utforska sparande, kapital och utdelningsantaganden över tid. Det är en modell för reflektion – inte prognos eller rådgivning.",
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
    status: "Under utveckling" as const,
    title: "Utökad marknadsöversikt",
    description:
      "Fortsatt utveckling av marknadsdata, bolagsinformation och tydligare sätt att följa marknadsrörelser inom plattformen.",
  },
  {
    status: "Planerat" as const,
    title: "Bevakningslista",
    description:
      "En yta för att samla bolag och tillgångar du vill följa över tid – utan att bli ett handelsverktyg.",
  },
  {
    status: "Planerat" as const,
    title: "Fördjupade portföljverktyg",
    description:
      "Grundläggande portföljspårning och förbättrad översikt över innehav och måluppföljning i allmän form – utan individuella köp- eller säljsignaler.",
  },
  {
    status: "Planerat" as const,
    title: "Börsskärm",
    description:
      "En fokuserad marknadsskärm för att följa rörelser och nyheter i ett samlat, lugnare gränssnitt.",
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

function FeatureCard({ icon, title, description, status }: FeatureItem) {
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
        href="/forum"
        className="rounded-xl border divlab-border-neutral px-6 py-3 text-center text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text"
      >
        Utforska forumet
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
