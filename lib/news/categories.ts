import type { NewsCategory, NewsCategoryFilter } from "@/types/news";

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  market: "Marknad",
  company: "Bolag",
  macro: "Makro",
  "funds-etfs": "Fonder & ETF:er",
  dividends: "Utdelningar",
};

export const NEWS_CATEGORY_FILTERS: {
  value: NewsCategoryFilter;
  label: string;
}[] = [
  { value: "all", label: "Alla" },
  { value: "market", label: NEWS_CATEGORY_LABELS.market },
  { value: "company", label: NEWS_CATEGORY_LABELS.company },
  { value: "macro", label: NEWS_CATEGORY_LABELS.macro },
  { value: "funds-etfs", label: NEWS_CATEGORY_LABELS["funds-etfs"] },
  { value: "dividends", label: NEWS_CATEGORY_LABELS.dividends },
];

export function getNewsCategoryLabel(category: NewsCategory) {
  return NEWS_CATEGORY_LABELS[category];
}
