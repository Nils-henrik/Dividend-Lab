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
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
          Portföljintelligens
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-white">
          Utvalda portföljnyheter
        </h2>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#161616] p-4">
        <div className="rounded-xl border border-white/10 bg-[#111111]/70 p-4">
          <PortfolioSearch value={searchQuery} onChange={onSearchChange} />

          {searchResult ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-white">
                  {searchResult.company}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {searchResult.ticker}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                  Senaste nyheter
                </p>
                <p className="mt-1 text-[12px] leading-5 text-gray-300">
                  {searchResult.latestNews}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                  Kommande händelser
                </p>
                <p className="mt-1 text-[12px] leading-5 text-gray-300">
                  {searchResult.upcomingEvent}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                  Senaste utdelning
                </p>
                <p className="mt-1 text-[12px] text-gray-300 tabular-nums">
                  {searchResult.latestDividend}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                  Rapporteringsdatum
                </p>
                <p className="mt-1 text-[12px] text-gray-300 tabular-nums">
                  {searchResult.earningsDate}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                  Utdelningshistorik
                </p>
                <p className="mt-1 text-[12px] text-gray-500">
                  {searchResult.dividendHistory ?? "Tillgänglig i en framtida version"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {futureSearchFields.map((field) => (
                <div
                  key={field}
                  className="rounded-lg border border-dashed border-white/10 px-2.5 py-2"
                >
                  <p className="text-[10px] uppercase tracking-[0.1em] text-gray-600">
                    {field}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 divide-y divide-white/10">
          {filteredItems.length === 0 ? (
            <p className="py-5 text-sm text-gray-500">
              Inga nyheter matchar din sökning.
            </p>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="py-3.5 transition-colors duration-300 first:pt-1 hover:bg-white/[0.015]"
              >
                <p className="text-[11px] font-medium tracking-[0.04em] text-[#D4AF37]">
                  {item.ticker}
                </p>
                <p className="mt-1.5 text-[15px] font-medium leading-snug text-white">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-gray-400">
                  {item.summary}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-600">
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
