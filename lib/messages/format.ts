const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";

function getStockholmDateKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatMessageTimestamp(value: string | null) {
  if (!value) {
    return "Ingen aktivitet än";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tid saknas";
  }

  const timeFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: STOCKHOLM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  const time = timeFormatter.format(date);
  const isToday = getStockholmDateKey(date) === getStockholmDateKey(new Date());

  if (isToday) {
    return time;
  }

  const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: STOCKHOLM_TIME_ZONE,
    day: "numeric",
    month: "long",
  });

  return `${dateFormatter.format(date)} ${time}`;
}
