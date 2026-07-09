type Props = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export default function LegalPlaceholderPage({
  title,
  description,
  children,
}: Props) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 md:px-8 md:py-24">
      <p className="mb-3 divlab-section-label">Dividend Lab</p>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-divlab-text md:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-divlab-text-secondary">
        {description}
      </p>
      <div className="divlab-card mt-8 space-y-4 p-6 text-sm leading-7 text-divlab-text-secondary">
        {children ?? (
          <p>
            Den här sidan är en MVP-plats hållare. Fullständigt innehåll publiceras
            innan lansering.
          </p>
        )}
      </div>
    </section>
  );
}
