import Link from "next/link";
import type { NewsCategoryFilter } from "@/types/news";
import { NEWS_CATEGORY_FILTERS } from "@/lib/news/categories";
import { buildNewsListHref } from "@/lib/news/list";

type Props = {
  value: NewsCategoryFilter;
};

export default function NewsCategoryFilter({ value }: Props) {
  return (
    <div
      className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0"
      aria-label="Filtrera börsnyheter efter kategori"
    >
      <div className="flex w-max gap-2 pb-0.5" role="tablist">
        {NEWS_CATEGORY_FILTERS.map((option) => {
          const isActive = value === option.value;
          const href = buildNewsListHref({ category: option.value, page: 1 });

          return (
            <Link
              key={option.value}
              href={href}
              role="tab"
              aria-selected={isActive}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${
                isActive
                  ? "divlab-selected"
                  : "border-transparent bg-divlab-surface text-divlab-text-muted hover:text-divlab-text-secondary"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
