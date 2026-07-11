import Link from "next/link";
import ForumSearch from "./ForumSearch";

type Props = {
  title: string;
  description: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchHint?: string;
  isAuthenticated?: boolean;
  newDiscussionHref?: string;
  loginHref?: string;
  showCreateAction?: boolean;
};

export default function ForumPageHeader({
  title,
  description,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  searchHint,
  isAuthenticated = false,
  newDiscussionHref = "/forum/new",
  loginHref = "/login?redirect=%2Fforum%2Fnew",
  showCreateAction = true,
}: Props) {
  const showSearch = searchQuery !== undefined && onSearchChange !== undefined;

  return (
    <section className="divlab-surface-panel p-3.5">
      <div
        className={`grid gap-4 ${showSearch ? "xl:grid-cols-[1fr_420px] xl:items-center" : ""}`}
      >
        <div>
          <p className="mb-1.5 divlab-section-label">Dividend Lab Forum</p>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-divlab-text">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-divlab-text-muted">
            {description}
          </p>
        </div>

        {(showSearch || showCreateAction) && (
          <div className="space-y-3">
            {showSearch && (
              <ForumSearch
                value={searchQuery}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                hint={searchHint}
              />
            )}
            {showCreateAction &&
              (isAuthenticated ? (
                <Link
                  href={newDiscussionHref}
                  className="divlab-btn-primary block w-full px-4 py-3"
                >
                  Starta diskussion
                </Link>
              ) : (
                <Link
                  href={loginHref}
                  className="block rounded-xl border divlab-inset px-4 py-3 text-center text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-blue/30 hover:text-divlab-blue-muted"
                >
                  Logga in för att starta en diskussion
                </Link>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
