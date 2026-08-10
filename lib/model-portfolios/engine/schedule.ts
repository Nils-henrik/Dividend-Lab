const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";
const WINDOW_MINUTES = 9;

export const MODEL_PORTFOLIO_EVALUATION_SLOTS = [
  { id: "open", hour: 9, minute: 0 },
  { id: "midday", hour: 13, minute: 30 },
  { id: "us-open", hour: 17, minute: 30 },
  { id: "close", hour: 22, minute: 30 },
] as const;

export type ModelPortfolioEvaluationSlotId =
  (typeof MODEL_PORTFOLIO_EVALUATION_SLOTS)[number]["id"];

export type ModelPortfolioResolvedSlot = {
  slotId: ModelPortfolioEvaluationSlotId;
  stockholmDate: string;
  triggerKey: string;
};

type StockholmParts = {
  date: string;
  weekday: string;
  hour: number;
  minute: number;
};

function stockholmParts(now: Date): StockholmParts | null {
  if (!Number.isFinite(now.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const year = value("year");
  const month = value("month");
  const day = value("day");
  const weekday = value("weekday");
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));

  if (
    !year ||
    !month ||
    !day ||
    !weekday ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null;
  }

  return {
    date: `${year}-${month}-${day}`,
    weekday,
    hour,
    minute,
  };
}

export function resolveModelPortfolioEvaluationSlot(
  now: Date,
): ModelPortfolioResolvedSlot | null {
  const local = stockholmParts(now);
  if (!local || local.weekday === "Sat" || local.weekday === "Sun") {
    return null;
  }

  const localMinuteOfDay = local.hour * 60 + local.minute;
  for (const slot of MODEL_PORTFOLIO_EVALUATION_SLOTS) {
    const scheduledMinute = slot.hour * 60 + slot.minute;
    const delta = localMinuteOfDay - scheduledMinute;
    if (delta >= 0 && delta <= WINDOW_MINUTES) {
      return {
        slotId: slot.id,
        stockholmDate: local.date,
        triggerKey: `scheduled:${local.date}:${slot.id}`,
      };
    }
  }

  return null;
}
