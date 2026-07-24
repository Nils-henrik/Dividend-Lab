import Link from "next/link";
import type { NewsCategoryFilter } from "@/types/news";
import {
  buildNewsListHref,
  getNewsPaginationItems,
} from "@/lib/news/list";

type Props = {
  category: NewsCategoryFilter;
  page: number;
  totalPages: number;
};

export default function NewsPagination({
  category,
  page,
  totalPages,
}: Props) {
  if (totalPages <= 1) {
    return null;
  }

  const items = getNewsPaginationItems(page, totalPages);
  const previousHref =
    page > 1 ? buildNewsListHref({ category, page: page - 1 }) : null;
  const nextHref =
    page < totalPages ? buildNewsListHref({ category, page: page + 1 }) : null;

  return (
    <nav
      aria-label="Sidnavigering för börsnyheter"
      className="border-t divlab-border-neutral pt-5"
    >
      <ul className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <li>
          {previousHref ? (
            <Link
              href={previousHref}
              className="inline-flex min-h-9 items-center rounded-xl border divlab-border-neutral px-3 py-1.5 text-xs font-medium text-divlab-text-secondary transition hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              aria-label="Föregående sida"
            >
              Föregående
            </Link>
          ) : (
            <span
              className="inline-flex min-h-9 cursor-not-allowed items-center rounded-xl border border-transparent px-3 py-1.5 text-xs font-medium text-divlab-text-subtle"
              aria-disabled="true"
            >
              Föregående
            </span>
          )}
        </li>

        {items.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <li
                key={`ellipsis-${index}`}
                className="px-1 text-xs text-divlab-text-subtle"
                aria-hidden="true"
              >
                …
              </li>
            );
          }

          const href = buildNewsListHref({ category, page: item });
          const isCurrent = item === page;

          return (
            <li key={item}>
              {isCurrent ? (
                <span
                  aria-current="page"
                  aria-label={`Sida ${item}`}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl border divlab-border-neutral bg-divlab-surface px-2.5 py-1.5 text-xs font-semibold text-divlab-text tabular-nums"
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={href}
                  aria-label={`Sida ${item}`}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl border border-transparent bg-divlab-surface px-2.5 py-1.5 text-xs font-medium text-divlab-text-muted tabular-nums transition hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                >
                  {item}
                </Link>
              )}
            </li>
          );
        })}

        <li>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex min-h-9 items-center rounded-xl border divlab-border-neutral px-3 py-1.5 text-xs font-medium text-divlab-text-secondary transition hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              aria-label="Nästa sida"
            >
              Nästa
            </Link>
          ) : (
            <span
              className="inline-flex min-h-9 cursor-not-allowed items-center rounded-xl border border-transparent px-3 py-1.5 text-xs font-medium text-divlab-text-subtle"
              aria-disabled="true"
            >
              Nästa
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
