import Link from "next/link";

const tools = [
  {
    eyebrow: "Planera",
    title: "Frihetsmaskinen",
    description: "Räkna på kapitalmål, sparande och vägen mot ekonomisk frihet.",
    href: "/frihetsmaskinen",
  },
  {
    eyebrow: "Räkna",
    title: "GAV-kalkylatorn",
    description: "Se hur ett nytt köp påverkar ditt genomsnittliga anskaffningsvärde.",
    href: "/verktyg/gav-kalkylator",
  },
] as const;

export default function DashboardToolsCard() {
  return (
    <section className="border-t divlab-border-neutral pt-7">
      <p className="divlab-section-label">Verktyg</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-2xl border divlab-border-neutral divlab-inset p-5 transition hover:border-divlab-blue/30 hover:bg-white/[0.04]"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
              {tool.eyebrow}
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-divlab-text transition group-hover:text-divlab-blue-muted">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                  {tool.description}
                </p>
              </div>
              <span className="shrink-0 text-divlab-text-muted transition group-hover:translate-x-0.5 group-hover:text-divlab-blue-muted">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
