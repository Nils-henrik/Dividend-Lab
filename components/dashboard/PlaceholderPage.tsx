import Link from "next/link";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  title: string;
  description: string;
  statusLabel?: string;
  backHref?: string;
  backLabel?: string;
};

export default function PlaceholderPage({
  title,
  description,
  statusLabel = "Kommer snart",
  backHref = "/dashboard",
  backLabel = "Tillbaka till översikt",
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center gap-3">
        <p className="divlab-section-label tracking-[0.25em]">
          {DIVLAB_BRAND_NAME}
        </p>
        <span className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-divlab-text-muted">
          {statusLabel}
        </span>
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
        {description}
      </p>
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#161616] p-6">
        <p className="text-sm leading-6 text-gray-400">
          Funktionen är inte färdig ännu. DivLab sparar ingen portfölj- eller
          bevakningsdata här. Använd Börsnyheter, Utbildning, Frihetsmaskinen,
          Forum eller översikten under tiden.
        </p>
        <Link
          href={backHref}
          className="divlab-link mt-4 inline-flex min-h-11 items-center text-sm font-medium"
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
