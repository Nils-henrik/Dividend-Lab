import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  title: string;
  description: string;
};

export default function PlaceholderPage({ title, description }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(0,0,0,0.22)]">
      <p className="mb-3 divlab-section-label tracking-[0.25em]">{DIVLAB_BRAND_NAME}</p>
      <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
        {description}
      </p>
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#161616] p-6">
        <p className="text-sm leading-6 text-gray-400">
          Sidan är redo för framtida DivLab-funktioner och använder redan
          den gemensamma applikationslayouten.
        </p>
      </div>
    </section>
  );
}
