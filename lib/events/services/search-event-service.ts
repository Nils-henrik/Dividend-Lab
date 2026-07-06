import type { CompanyEvent } from "../types/company-event";
import type { EventRepositoryContract } from "../repository/event-repository-contract";
import { mockCompanySearchRaw } from "../providers/mock/raw-events";

export type CompanySearchSnapshot = {
  ticker: string;
  company: string;
  latestNews: string;
  upcomingEvent: string;
  latestDividend: string;
  earningsDate: string;
  dividendHistory?: string;
};

export class SearchEventService {
  constructor(private readonly repository: EventRepositoryContract) {}

  searchCompanies(query: string): CompanySearchSnapshot[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return this.getSearchIndex();
    }

    return this.getSearchIndex().filter((company) => {
      const searchable = [company.company, company.ticker].join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }

  getSearchIndex(): CompanySearchSnapshot[] {
    return mockCompanySearchRaw.map((entry) => ({
      ticker: entry.symbol,
      company: entry.company_name,
      latestNews: entry.latest_news,
      upcomingEvent: entry.upcoming_event,
      latestDividend: entry.latest_dividend,
      earningsDate: entry.earnings_date,
      dividendHistory: "dividend_history" in entry ? entry.dividend_history : undefined,
    }));
  }

  getCompanySnapshot(ticker: string): CompanySearchSnapshot | undefined {
    return this.getSearchIndex().find(
      (company) => company.ticker.toLowerCase() === ticker.toLowerCase(),
    );
  }

  searchEvents(query: string, portfolioOnly = true): CompanyEvent[] {
    return this.repository.query({ query, portfolioOnly });
  }
}
