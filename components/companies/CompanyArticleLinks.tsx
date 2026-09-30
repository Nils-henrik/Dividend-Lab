import Link from "next/link";

type CompanyLink = {
  slug: string;
  name: string;
  ticker: string;
  href: string;
};

export default function CompanyArticleLinks({ companies }: { companies: readonly CompanyLink[] }) {
  if (companies.length === 0) return null;

  return (
    <section aria-labelledby="article-companies" className="border-t divlab-border-neutral pt-6">
      <h2 id="article-companies" className="text-sm font-semibold text-divlab-text">
        Bolag i artikeln
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {companies.map((company) => (
          <li key={company.slug}>
            <Link
              href={company.href}
              className="inline-flex min-h-11 items-center rounded-full border divlab-border-neutral px-3 text-xs font-semibold text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 hover:text-divlab-blue"
            >
              {company.name}
              <span className="ml-1 font-medium text-divlab-text-muted">{company.ticker}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
