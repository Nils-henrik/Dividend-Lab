import { formatMarketPulseTime } from "@/lib/news/market-pulse";

export function formatNewsPublishedAt(publishedAt: string) {
  return formatMarketPulseTime(publishedAt);
}
