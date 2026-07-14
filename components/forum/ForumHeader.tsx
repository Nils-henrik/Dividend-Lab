import Link from "next/link";
import ForumSearch from "./ForumSearch";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategoryName: string;
  isAuthenticated: boolean;
  newDiscussionHref: string;
  loginHref: string;
};

export default function ForumHeader({
  searchQuery,
  onSearchChange,
  activeCategoryName,
  isAuthenticated,
  newDiscussionHref,
  loginHref,
}: Props) {
  return (
    <section className="divlab-surface-panel p-3.5">
      <div className="grid gap-4 xl:grid-cols-[1fr_420px] xl:items-center">
        <div>
          <p className="mb-1.5 divlab-section-label">DivLab Forum</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-divlab-text">
            {activeCategoryName}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-divlab-text-muted">
            Lär av erfarna investerare, granska portföljtänkande och hitta
            hållbara inkomstidéer utan marknadsbrus.
          </p>
        </div>

        <div className="space-y-3">
          <ForumSearch
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={`Sök diskussioner i ${activeCategoryName}...`}
            hint={`Söker bland inlästa diskussioner i ${activeCategoryName}.`}
          />
          {isAuthenticated ? (
            <Link href={newDiscussionHref} className="divlab-btn-primary block w-full px-4 py-3">
              Starta diskussion
            </Link>
          ) : (
            <Link
              href={loginHref}
              className="block rounded-xl border divlab-inset px-4 py-3 text-center text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-blue/30 hover:text-divlab-blue-muted"
            >
              Logga in för att starta en diskussion
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
