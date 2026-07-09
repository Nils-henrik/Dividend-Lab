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
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
        Dividend Lab
      </p>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-gray-400">{description}</p>
      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#111111]/85 p-6 text-sm leading-7 text-gray-400">
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
