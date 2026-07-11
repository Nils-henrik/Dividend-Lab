import Link from "next/link";
import type { ForumCompanyRecord } from "@/lib/forum/companies/types";
import {
  formatForumCompanyMetadata,
  getForumCompanyCountryLabel,
} from "@/lib/forum/companies/filters";

type Props = {
  company: ForumCompanyRecord;
};

export default function ForumCompanyRow({ company }: Props) {
  const metadata = formatForumCompanyMetadata(
    company.primaryTicker,
    company.exchange,
  );
  const countryLabel = getForumCompanyCountryLabel(company.countryCode);
  const collectionLabels = company.collections.map((collection) => collection.name);

  return (
    <Link
      href={`/forum/bolag/${company.slug}`}
      aria-label={`${company.name}, ${metadata}, ${countryLabel}`}
      className="block border-b divlab-border-neutral px-5 py-3.5 transition last:border-0 divlab-row-hover"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-divlab-text">
          {company.name}
        </h3>
        <span className="rounded-md border divlab-border-neutral px-2 py-0.5 text-[11px] font-medium text-divlab-text-muted">
          {company.primaryTicker}
        </span>
      </div>

      <p className="mt-1 text-sm text-divlab-text-secondary">{metadata}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-divlab-text-muted">
        <span>{countryLabel}</span>
        {collectionLabels.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>{collectionLabels.join(", ")}</span>
          </>
        )}
      </div>
    </Link>
  );
}
