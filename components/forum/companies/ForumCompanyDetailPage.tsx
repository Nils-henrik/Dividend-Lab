import type { ForumCompanyRecord } from "@/lib/forum/companies/types";
import {
  formatForumCompanyMetadata,
  getForumCompanyCountryLabel,
} from "@/lib/forum/companies/filters";
import ForumBreadcrumbs from "@/components/forum/ForumBreadcrumbs";
import ForumSubnav from "@/components/forum/ForumSubnav";
import ForumCompanyAvatar from "./ForumCompanyAvatar";

type Props = {
  company: ForumCompanyRecord;
};

export default function ForumCompanyDetailPage({ company }: Props) {
  const metadata = formatForumCompanyMetadata(
    company.primaryTicker,
    company.exchange,
  );
  const countryLabel = getForumCompanyCountryLabel(company.countryCode);

  return (
    <div className="space-y-3">
      <ForumSubnav />

      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: "Bolag", href: "/forum/bolag" },
          { label: company.name },
        ]}
      />

      <section className="divlab-surface-panel p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-divlab-text">
              {company.name}
            </h1>
            <p className="mt-2 text-sm text-divlab-text-secondary">{metadata}</p>
            <p className="mt-1 text-sm text-divlab-text-muted">{countryLabel}</p>
          </div>

          <ForumCompanyAvatar
            name={company.name}
            logoPath={company.logoPath}
          />
        </div>

        {company.collections.length > 0 && (
          <div className="mt-5 border-t divlab-border-neutral pt-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
              Listor och index
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {company.collections.map((collection) => (
                <span
                  key={collection.slug}
                  className="rounded-md border divlab-border-neutral px-2 py-1 text-[11px] font-medium text-divlab-text-muted"
                >
                  {collection.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="divlab-card p-6">
        <h2 className="text-sm font-semibold text-divlab-text">
          Bolagsdiskussioner kommer snart
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-divlab-text-muted">
          Här kommer du att kunna följa och delta i diskussioner om {company.name}.
          Bolagsspecifika trådar läggs till snart.
        </p>
      </section>
    </div>
  );
}
