"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CompanyLogo from "@/components/companies/CompanyLogo";
import { companyMatchesQuery } from "@/lib/companies/watchlist";
import type { MentionedCompany, UpcomingReport } from "@/lib/companies/hub";
import type { CompanyProfile } from "@/lib/companies/types";

type Props = {
  companies: readonly CompanyProfile[];
  upcoming: readonly UpcomingReport[];
  mentioned: readonly MentionedCompany[];
};

function date(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Stockholm",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export default function CompanyDirectory({ companies, upcoming, mentioned }: Props) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [letter, setLetter] = useState("all");
  const sectors = useMemo(
    () => [...new Set(companies.map((company) => company.sector))].sort((left, right) => left.localeCompare(right, "sv")),
    [companies],
  );
  const letters = useMemo(
    () => [...new Set(companies.map((company) => company.displayName.charAt(0).toLocaleUpperCase("sv")))].sort((left, right) => left.localeCompare(right, "sv")),
    [companies],
  );
  const searching = query.trim().length > 0;
  const visible = companies
    .filter((company) => companyMatchesQuery(company, query))
    .filter((company) => sector === "all" || company.sector === sector)
    .filter((company) => letter === "all" || company.displayName.charAt(0).toLocaleUpperCase("sv") === letter)
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "sv"));

  return (
    <div className="space-y-4">
      <section className="divlab-card p-4 sm:p-5">
        <label htmlFor="company-search" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-divlab-text-muted">
          Sök bolag
        </label>
        <input
          id="company-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Namn, ticker eller alias"
          className="mt-2 w-full rounded-xl border divlab-border-neutral bg-divlab-bg px-3 py-3 text-sm text-divlab-text outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Sektorer">
          <FilterChip active={sector === "all"} onClick={() => setSector("all")} label="Alla sektorer" />
          {sectors.map((item) => (
            <FilterChip key={item} active={sector === item} onClick={() => setSector(item)} label={item} />
          ))}
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto" aria-label="Alfabetiskt">
          <FilterChip active={letter === "all"} onClick={() => setLetter("all")} label="A–Ö" />
          {letters.map((item) => (
            <FilterChip key={item} active={letter === item} onClick={() => setLetter(item)} label={item} />
          ))}
        </div>
      </section>

      {!searching && upcoming.length ? (
        <section className="divlab-card p-4 sm:p-5" aria-labelledby="reporting-soon">
          <h2 id="reporting-soon" className="text-[15px] font-bold text-divlab-text">Rapporterar snart</h2>
          <ul className="mt-3 divide-y divide-[var(--divlab-divider)]">
            {upcoming.map((row) => (
              <li key={`${row.slug}-${row.date}-${row.title}`}>
                <Link href={`/bolag/${row.slug}`} className="divlab-row-hover grid gap-1 py-3 sm:grid-cols-[88px_minmax(0,1fr)]">
                  <time className="text-[11px] text-divlab-text-secondary">{date(row.date)}</time>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-divlab-text">{row.name}</span>
                    <span className="block truncate text-[11px] text-divlab-text-muted">{row.ticker} · {row.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!searching && mentioned.length ? (
        <section className="divlab-card p-4 sm:p-5" aria-labelledby="mentioned-companies">
          <h2 id="mentioned-companies" className="text-[15px] font-bold text-divlab-text">Nyligen omnämnda i DivLab</h2>
          <p className="mt-1 text-[11px] leading-5 text-divlab-text-muted">Bolag som förekommer i publicerade DivLab-artiklar. Ingen popularitetsranking.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {mentioned.map((company) => (
              <li key={company.slug}>
                <Link href={`/bolag/${company.slug}`} className="divlab-row-hover block rounded-lg py-2">
                  <span className="block text-[13px] font-semibold text-divlab-text">{company.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-divlab-text-muted">{company.ticker} · {company.articleTitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="divlab-card p-4 sm:p-5" aria-labelledby="all-companies">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="all-companies" className="text-[15px] font-bold text-divlab-text">Alla följbara bolag</h2>
          <p className="text-[11px] text-divlab-text-muted">{visible.length} bolag</p>
        </div>
        {visible.length ? (
          <ul className="mt-2 divide-y divide-[var(--divlab-divider)]">
            {visible.map((company) => (
              <li key={company.slug}>
                <Link href={`/bolag/${company.slug}`} className="divlab-row-hover flex items-center gap-3 py-3">
                  <CompanyLogo name={company.name} logoPath={company.logoPath} size="compact" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-divlab-text">{company.displayName}</span>
                    <span className="block truncate text-[11px] text-divlab-text-muted">{company.ticker} · {company.exchange} · {company.sector}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs leading-5 text-divlab-text-muted">Inget bolag matchar sökningen.</p>
        )}
      </section>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 ${
        active
          ? "border-divlab-blue bg-divlab-blue/10 text-divlab-text"
          : "divlab-border-neutral text-divlab-text-secondary"
      }`}
    >
      {label}
    </button>
  );
}
