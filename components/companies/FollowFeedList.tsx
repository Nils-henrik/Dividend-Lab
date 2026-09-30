import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";
import type { FollowFeedItem, FollowFeedKind } from "@/lib/companies/follow-feed";

const ICONS: Record<FollowFeedKind, AppIconName> = {
  calendar: "calendar",
  report: "news",
  dividend: "pieChart",
  press: "compose",
  article: "news",
  price_move: "chart",
};

function isInternal(href: string) {
  return href.startsWith("/");
}

function SourceLink({ href, label }: { href: string; label: string }) {
  const className =
    "text-xs font-semibold text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 hover:underline";

  if (isInternal(href)) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className} rel="noopener noreferrer" target="_blank">
      {label}
    </a>
  );
}

export default function FollowFeedList({ items }: { items: readonly FollowFeedItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-divlab-text-secondary">
        Inga händelser i det här filtret.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-[var(--divlab-divider)]">
      {items.map((item) => (
        <li key={item.id}>
          <article className="flex items-start gap-3 px-4 py-3 sm:px-5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-divlab-blue/10 text-divlab-blue">
              <AppIcon name={ICONS[item.kind]} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-sm font-semibold text-divlab-text">{item.companyName}</p>
                <p className="text-xs text-divlab-text-muted">{item.ticker}</p>
                <span className="rounded-md bg-divlab-blue/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-divlab-blue">
                  {item.typeLabel}
                </span>
                <time
                  className="text-xs tabular-nums text-divlab-text-secondary sm:ml-auto"
                  dateTime={item.sortAt}
                >
                  {item.dateLabel}
                </time>
              </div>
              <h3 className="mt-1 break-words text-sm font-semibold leading-5 text-divlab-text">
                <SourceLink href={item.href} label={item.title} />
              </h3>
              <p className="mt-1 text-xs text-divlab-text-muted">
                {item.sourceLabel}
                <span aria-hidden="true"> · </span>
                <span>{item.freshnessLabel}</span>
                {item.recencyCue ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span>{item.recencyCue}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-2">
                <Link
                  href={item.companyHref}
                  className="text-xs font-semibold text-divlab-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 hover:text-divlab-blue"
                >
                  Bolagssida
                </Link>
              </p>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
