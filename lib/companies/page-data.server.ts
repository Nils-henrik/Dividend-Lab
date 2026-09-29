import "server-only";

import { cache } from "react";
import { getCompanyProfile, getPilotCompanies } from "@/lib/companies/catalog";
import { fetchPaidDividends } from "@/lib/companies/dividend-history.server";
import { getCompanyMarketData } from "@/lib/companies/market-data";
import { getCompanyNews } from "@/lib/companies/news";
import { getCompanyOfficialData } from "@/lib/companies/official-data.server";
import { buildCompanyPageModel, type PageMarketInput } from "@/lib/companies/page-model";
import { selectLatestReportSnapshotUrl } from "@/lib/companies/report-snapshot";
import { loadCompanyReportSnapshot } from "@/lib/companies/report-snapshot.server";
import { sectorPeers } from "@/lib/companies/peers";
import { getCompanyFollowState } from "@/lib/companies/server";
import { getNewsArticles } from "@/lib/news/get-articles";

export const loadCompanyPage = cache(async (slug: string, userId: string | undefined) => {
  const company = getCompanyProfile(slug);
  if (!company) return null;
  const followState = await getCompanyFollowState(company.slug, userId);
  const reportUrl = selectLatestReportSnapshotUrl(company.slug, followState.documents);
  const [marketData, officialData, paidDividends, reportSnapshot] = await Promise.all([
    getCompanyMarketData(company, true, true),
    getCompanyOfficialData(company, followState),
    fetchPaidDividends(company.marketDataSymbol),
    loadCompanyReportSnapshot(company.slug, reportUrl),
  ]);
  const market: PageMarketInput = {
    price: marketData.price,
    change: marketData.change,
    changePct: marketData.changePct,
    currency: marketData.currency,
    volume: marketData.volume,
    marketTimestamp: marketData.marketTimestamp,
    marketCap: marketData.marketCap,
    week52Low: marketData.week52Low,
    week52High: marketData.week52High,
    sourceUrl: marketData.sourceUrl,
    valuation: marketData.valuation,
    financials: marketData.financials,
  };
  const articles = getCompanyNews(company, getNewsArticles(), 5);
  const peers = sectorPeers(company, getPilotCompanies());
  const model = buildCompanyPageModel({
    company,
    market,
    official: officialData,
    articles,
    paidDividends,
    documents: followState.documents,
    reportSnapshot,
  });
  return { company, followState, marketData, officialData, articles, peers, model };
});
