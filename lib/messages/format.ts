import {
  formatStockholmDateTime,
  formatStockholmTime,
  getStockholmDateKey,
  parseDate,
} from "@/lib/time";

export function formatMessageTimestamp(value: string | null) {
  if (!value) {
    return "Ingen aktivitet än";
  }

  const date = parseDate(value);

  if (!date) {
    return "Tid saknas";
  }

  const time = formatStockholmTime(date);
  const isToday = getStockholmDateKey(date) === getStockholmDateKey(new Date());

  if (isToday) {
    return time;
  }

  const formattedDate = formatStockholmDateTime(date, {
    day: "numeric",
    month: "long",
  });

  return `${formattedDate} ${time}`;
}
