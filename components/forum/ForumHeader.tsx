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
    <section className="rounded-lg border border-white/10 bg-[#111111]/85 p-3.5">
      <div className="grid gap-4 xl:grid-cols-[1fr_420px] xl:items-center">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
            Dividend Lab Forum
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            {activeCategoryName}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            Lär av erfarna investerare, granska portföljtänkande och hitta
            hållbara inkomstidéer utan marknadsbrus.
          </p>
        </div>

        <div className="space-y-3">
          <ForumSearch
            value={searchQuery}
            onChange={onSearchChange}
            activeCategoryName={activeCategoryName}
          />
          {isAuthenticated ? (
            <Link
              href={newDiscussionHref}
              className="block w-full rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-center text-sm font-medium text-[#D4AF37] transition hover:border-[#D4AF37]/50"
            >
              Starta diskussion
            </Link>
          ) : (
            <Link
              href={loginHref}
              className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
            >
              Logga in för att starta en diskussion
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
