import { LEGAL_LAST_UPDATED } from "@/lib/legal/legal-config";

type LayoutProps = {
  title: string;
  description: string;
  publishedVersion?: {
    version: string;
    effectiveDateLabel: string;
  };
  children: React.ReactNode;
};

type SectionProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
};

export function LegalSection({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold text-divlab-text">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-divlab-text-secondary">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function LegalPageLayout({
  title,
  description,
  publishedVersion,
  children,
}: LayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-20">
      <header>
        <p className="divlab-section-label">DivLab</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-divlab-text md:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-divlab-text-secondary">
          {description}
        </p>
        {publishedVersion && (
          <p className="mt-3 text-xs text-divlab-text-muted">
            Version {publishedVersion.version} – gäller från{" "}
            {publishedVersion.effectiveDateLabel}
          </p>
        )}
        <p className="mt-4 text-xs text-divlab-text-muted">
          Senast uppdaterad: {LEGAL_LAST_UPDATED}
        </p>
      </header>

      <div className="mt-10 space-y-10 border-t divlab-border-neutral pt-10">
        {children}
      </div>
    </article>
  );
}
