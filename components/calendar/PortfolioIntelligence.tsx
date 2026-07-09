"use client";

import { useMemo } from "react";
import type { CompanySearchResult, IntelligenceItem } from "@/types/calendar";
import { intelligenceTypeLabels } from "@/lib/events";
import PortfolioSearch from "./PortfolioSearch";

type Props = {
  items: IntelligenceItem[];
  searchIndex: CompanySearchResult[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

const futureSearchFields = [
  "Senaste nyheter",
  "Kommande händelser",
  "Senaste utdelning",
  "Rapporteringsdatum",
  "Utdelningshistorik",
] as const;

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function PortfolioIntelligence({
  items,
  searchIndex,
  searchQuery,
  onSearchChange,
}: Props) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      const searchable = [item.company, item.ticker, item.title, item.summary]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [items, normalizedQuery]);

  const searchResult = useMemo(() => {
    if (!normalizedQuery) {
      return null;
    }

    return (
      searchIndex.find((company) => {
        const searchable = [company.company, company.ticker]
          .join(" ")
          .toLowerCase();
        return searchable.includes(normalizedQuery);
      }) ?? null
    );
  }, [normalizedQuery, searchIndex]);

  return (
    <section>
      <div className="mb-3">
        <p className="divlab-section-label text-[10px] tracking-[0.22em]">
          Portföljintelligens
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-divlab-text">
          Utvalda portföljnyheter
        </h2>
      </div>

      <div className="divlab-card p-4">
        <div className="rounded-xl border divlab-border-neutral bg-divlab-surface p-4">
          <PortfolioSearch value={searchQuery} onChange={onSearchChange} />

          {searchResult ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-divlab-text">
                  {searchResult.company}
                </p>
                <p className="mt-0.5 text-xs text-divlab-text-muted">
                  {searchResult.ticker}
                </p>
              </div>

              {(
                [
                  ["Senaste nyheter", searchResult.latestNews],
                  ["Kommande händelser", searchResult.upcomingEvent],
                  ["Senaste utdelning", searchResult.latestDividend],
                  ["Rapporteringsdatum", searchResult.earningsDate],
                  [
                    "Utdelningshistorik",
                    searchResult.dividendHistory ??
                      "Tillgänglig i en framtida version",
                  ],
                ] as const
              ).map(([label, value], index) => (
                <div
                  key={label}
                  className={`rounded-lg border divlab-border-neutral bg-divlab-card px-3 py-2.5 ${
                    index === 4 ? "sm:col-span-2" : ""
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] text-divlab-text-subtle">
                    {label}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-divlab-text-secondary">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {futureSearchFields.map((field) => (
                <div
                  key={field}
                  className="rounded-lg border border-dashed divlab-border-neutral px-2.5 py-2"
                >
                  <p className="text-[10px] uppercase tracking-[0.1em] text-divlab-text-subtle">
                    {field}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 divide-y divide-white/[0.06]">
          {filteredItems.length === 0 ? (
            <p className="py-5 text-sm text-divlab-text-muted">
              Inga nyheter matchar din sökning.
            </p>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="py-3.5 transition-colors duration-300 first:pt-1 hover:bg-white/[0.02]"
              >
                <p className="text-[11px] font-medium tracking-[0.04em] text-divlab-blue">
                  {item.ticker}
                </p>
                <p className="mt-1.5 text-[15px] font-medium leading-snug text-divlab-text">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-divlab-text-secondary">
                  {item.summary}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-divlab-text-muted">
                  <span className="uppercase tracking-[0.1em]">
                    {intelligenceTypeLabels[item.type]}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
