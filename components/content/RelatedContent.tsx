import Link from "next/link";
import type { RelatedContentLink } from "@/lib/news/internal-links";

type Props = {
  links: readonly RelatedContentLink[];
};

export default function RelatedContent({ links }: Props) {
  if (links.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="related-content-heading"
      className="space-y-4 border-t divlab-border-neutral pt-8"
    >
      <h2
        id="related-content-heading"
        className="text-2xl font-semibold text-divlab-text"
      >
        Relaterat på DivLab
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group block h-full rounded-xl border divlab-border-neutral divlab-inset px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
            >
              <span className="divlab-section-label text-divlab-blue-muted">
                {link.kind === "learning" ? "Utbildning" : "Börsnyheter"}
              </span>
              <span className="mt-2 block text-base font-medium leading-6 text-divlab-text group-hover:underline group-hover:decoration-divlab-blue/30 group-hover:underline-offset-4">
                {link.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
