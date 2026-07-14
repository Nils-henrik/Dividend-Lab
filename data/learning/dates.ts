import { formatStockholmDateTime, parseDate } from "@/lib/time";

function parseIsoDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);

  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return parseDate(isoDate);
}

export function formatLearningArticleDate(isoDate: string) {
  const date = parseIsoDate(isoDate);

  if (!date) {
    return null;
  }

  return formatStockholmDateTime(date, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
