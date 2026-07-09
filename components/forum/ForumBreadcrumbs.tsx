import Link from "next/link";
import { Fragment } from "react";

type Breadcrumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Breadcrumb[];
};

export default function ForumBreadcrumbs({ items }: Props) {
  return (
    <nav
      aria-label="Forum-navigering"
      className="flex min-w-0 items-center gap-2 text-[11px] leading-5 text-gray-500"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <span aria-hidden="true" className="shrink-0 text-gray-600">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="shrink-0 transition hover:text-[#D4AF37]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`text-gray-400 ${
                  isLast ? "min-w-0 truncate" : "shrink-0"
                }`}
                title={isLast ? item.label : undefined}
              >
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
