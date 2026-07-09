"use client";

import Link from "next/link";
import type { GlobalSearchResults } from "@/lib/search/types";

type Props = {
  results: GlobalSearchResults;
  isLoading: boolean;
  query: string;
  onSelect: () => void;
};

function ResultGroup({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: GlobalSearchResults["users"];
  onSelect: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <ul className="space-y-1 px-2 pb-2">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={item.href}
              onClick={onSelect}
              className="block rounded-xl px-3 py-2.5 transition hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {item.subtitle}
                    </p>
                  )}
                  {item.preview && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-400">
                      {item.preview}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {item.type === "user"
                    ? "Profil"
                    : item.type === "forum"
                      ? "Ämne"
                      : "Artikel"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SearchResultsPanel({
  results,
  isLoading,
  query,
  onSelect,
}: Props) {
  const hasResults =
    results.users.length > 0 ||
    results.forum.length > 0 ||
    results.learning.length > 0;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
      {isLoading ? (
        <p className="px-4 py-5 text-sm text-gray-500">Söker...</p>
      ) : query.trim().length < 2 ? (
        <p className="px-4 py-5 text-sm text-gray-500">
          Skriv minst 2 tecken för att söka.
        </p>
      ) : !hasResults ? (
        <p className="px-4 py-5 text-sm text-gray-500">
          Inga träffar för &quot;{query.trim()}&quot;.
        </p>
      ) : (
        <div className="max-h-[min(28rem,70vh)] overflow-y-auto py-1">
          <ResultGroup label="Användare" items={results.users} onSelect={onSelect} />
          <ResultGroup
            label="Forumämnen"
            items={results.forum}
            onSelect={onSelect}
          />
          <ResultGroup
            label="Utbildning"
            items={results.learning}
            onSelect={onSelect}
          />
        </div>
      )}
    </div>
  );
}
