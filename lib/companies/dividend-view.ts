export type DividendKind = "board_proposal" | "decided" | "paid" | "unspecified";

export type PaidDividend = {
  exDate: string;
  amount: number;
  currency: string;
};

export const DIVIDEND_KIND_LABEL: Record<DividendKind, string> = {
  board_proposal: "Styrelseförslag",
  decided: "Beslutad utdelning",
  paid: "Historiskt utbetald utdelning",
  unspecified: "Officiell utdelning per aktie",
};

const PROPOSAL_PATTERN = /styrelseförslag/i;

/**
 * A numeric dividend is never treated as decided unless the caller passes that kind explicitly.
 * A board proposal stays a proposal even when an amount is present.
 */
export function classifyOfficialDividend(input: {
  perShare: number | null;
  blocker: string | null;
  explicitKind?: DividendKind | null;
}): { kind: DividendKind; perShare: number | null } {
  if (input.explicitKind === "board_proposal") {
    return { kind: "board_proposal", perShare: input.perShare };
  }
  if (input.explicitKind === "decided" || input.explicitKind === "paid") {
    return { kind: input.explicitKind, perShare: input.perShare };
  }
  if (input.perShare === null && PROPOSAL_PATTERN.test(input.blocker ?? "")) {
    return { kind: "board_proposal", perShare: null };
  }
  return { kind: "unspecified", perShare: input.perShare };
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "raw" in value) {
    return readNumber((value as { raw?: unknown }).raw);
  }
  return null;
}

function readDate(value: unknown): string | null {
  const raw = value && typeof value === "object" && "raw" in value
    ? readNumber((value as { raw?: unknown }).raw)
    : readNumber(value);
  if (raw === null || raw <= 0) return null;
  const date = new Date(raw > 10_000_000_000 ? raw : raw * 1000);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function parseYahooDividendChart(body: unknown): {
  currency: string | null;
  events: Array<{ exDate: string; amount: number }>;
} {
  if (!body || typeof body !== "object") return { currency: null, events: [] };
  const result = (body as { chart?: { result?: Array<Record<string, unknown>> } }).chart?.result?.[0];
  if (!result) return { currency: null, events: [] };
  const meta = result.meta;
  const currency = meta && typeof meta === "object" && typeof (meta as { currency?: unknown }).currency === "string"
    ? (meta as { currency: string }).currency
    : null;
  const dividends = result.events && typeof result.events === "object"
    ? (result.events as { dividends?: Record<string, { amount?: unknown; date?: unknown }> }).dividends
    : null;
  if (!dividends || typeof dividends !== "object") return { currency, events: [] };
  const events = Object.values(dividends).flatMap((entry) => {
    const amount = readNumber(entry?.amount);
    const exDate = readDate(entry?.date);
    if (amount === null || amount <= 0 || !exDate) return [];
    return [{ exDate, amount }];
  });
  const seen = new Set<string>();
  return {
    currency,
    events: events
      .sort((left, right) => left.exDate.localeCompare(right.exDate))
      .filter((event) => {
        const key = `${event.exDate}:${event.amount}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
  };
}

function stockholmYear(now: Date) {
  return Number(new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
  }).format(now));
}

/**
 * CAGR of cash dividends summed by completed calendar year.
 * Requires an unbroken run that ends in the latest completed year.
 * 5-year needs six years. 3-year needs four. Otherwise null.
 */
export function paidDividendGrowth(
  events: readonly PaidDividend[],
  now = new Date(),
): { years: 3 | 5; cagr: number } | null {
  if (events.length === 0) return null;
  const currencies = new Set(events.map((event) => event.currency));
  if (currencies.size !== 1) return null;
  const totals = new Map<number, number>();
  for (const event of events) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.exDate) || !(event.amount > 0)) return null;
    const year = Number(event.exDate.slice(0, 4));
    totals.set(year, (totals.get(year) ?? 0) + event.amount);
  }
  const lastCompleted = stockholmYear(now) - 1;
  const years = [...totals.keys()].sort((left, right) => left - right);
  if (years.at(-1) !== lastCompleted) return null;
  let run = 1;
  for (let index = years.length - 1; index > 0; index -= 1) {
    if (years[index] - years[index - 1] !== 1) break;
    run += 1;
  }
  const span = run >= 6 ? 5 : run >= 4 ? 3 : null;
  if (!span) return null;
  const window = years.slice(-1 * (span + 1));
  const start = totals.get(window[0] ?? -1);
  const end = totals.get(window.at(-1) ?? -1);
  if (start === undefined || end === undefined || start <= 0 || end <= 0) return null;
  return { years: span, cagr: (end / start) ** (1 / span) - 1 };
}
