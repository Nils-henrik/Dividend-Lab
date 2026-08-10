import { convertNativeMinorToSek, type FxRateQuote } from "./fx";

export type DividendLedgerTransaction = {
  instrumentSymbol: string;
  exchange: string;
  transactionType: "buy" | "sell" | "dividend" | "fee";
  quantity: number;
  executedAt: string;
};

export type DividendEventInput = {
  portfolioId: string;
  instrumentSymbol: string;
  exchange: string;
  instrumentName: string;
  exDate: string;
  paymentDate: string;
  /** Dividend per share in native minor units. */
  nativeAmountPerShareMinor: number;
  nativeCurrency: string;
  sourcePublisher: string;
  sourceEventKey: string;
};

export type DividendCreditPlan =
  | {
      ok: true;
      eligibleQuantity: number;
      nativeCurrency: string;
      nativeGrossMinor: number;
      fxRateToSek: number;
      fxAsOf: string;
      fxSourcePublisher: string;
      grossAmountSekMinor: number;
      cashDeltaMinor: number;
      idempotencyKey: string;
    }
  | {
      ok: false;
      reason:
        | "not_eligible"
        | "invalid_event"
        | "fx_unavailable"
        | "unsupported_currency"
        | "payment_not_due";
    };

function dateOnly(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Reconstruct simulated quantity held as of the ex-date close using the
 * transaction ledger. Dividends and fees do not change share quantity.
 */
export function quantityHeldOnExDate(
  transactions: readonly DividendLedgerTransaction[],
  instrumentSymbol: string,
  exchange: string,
  exDate: string,
): number {
  const ex = dateOnly(exDate);
  if (!ex) return 0;
  const symbol = instrumentSymbol.trim().toUpperCase();
  const exch = exchange.trim().toUpperCase();

  let quantity = 0;
  for (const row of transactions) {
    if (row.instrumentSymbol.trim().toUpperCase() !== symbol) continue;
    if (row.exchange.trim().toUpperCase() !== exch) continue;
    const executed = dateOnly(row.executedAt);
    if (!executed || executed > ex) continue;
    if (row.transactionType === "buy") quantity += Number(row.quantity);
    if (row.transactionType === "sell") quantity -= Number(row.quantity);
  }
  return quantity > 0 ? quantity : 0;
}

export function planDividendCredit(input: {
  event: DividendEventInput;
  transactions: readonly DividendLedgerTransaction[];
  fxRateToSek: FxRateQuote | null;
  now: Date;
}): DividendCreditPlan {
  const event = input.event;
  const exDate = dateOnly(event.exDate);
  const paymentDate = dateOnly(event.paymentDate);
  if (
    !exDate ||
    !paymentDate ||
    paymentDate < exDate ||
    !event.portfolioId.trim() ||
    !event.instrumentSymbol.trim() ||
    !event.exchange.trim() ||
    !event.instrumentName.trim() ||
    !event.sourcePublisher.trim() ||
    !event.sourceEventKey.trim() ||
    !Number.isFinite(event.nativeAmountPerShareMinor) ||
    !Number.isInteger(event.nativeAmountPerShareMinor) ||
    event.nativeAmountPerShareMinor <= 0
  ) {
    return { ok: false, reason: "invalid_event" };
  }

  const today = input.now.toISOString().slice(0, 10);
  if (today < paymentDate) return { ok: false, reason: "payment_not_due" };

  const eligibleQuantity = quantityHeldOnExDate(
    input.transactions,
    event.instrumentSymbol,
    event.exchange,
    exDate,
  );
  if (eligibleQuantity <= 0) return { ok: false, reason: "not_eligible" };

  const nativeGrossMinor = Math.round(eligibleQuantity * event.nativeAmountPerShareMinor);
  const converted = convertNativeMinorToSek({
    nativeCurrency: event.nativeCurrency,
    nativeAmountMinor: nativeGrossMinor,
    fxRateToSek: input.fxRateToSek,
  });
  if (!converted.ok) {
    return {
      ok: false,
      reason: converted.reason === "unsupported_currency" ? "unsupported_currency" : "fx_unavailable",
    };
  }

  return {
    ok: true,
    eligibleQuantity,
    nativeCurrency: converted.nativeCurrency,
    nativeGrossMinor,
    fxRateToSek: converted.fxRateToSek,
    fxAsOf: converted.fxAsOf,
    fxSourcePublisher: converted.fxSourcePublisher,
    grossAmountSekMinor: converted.sekAmountMinor,
    cashDeltaMinor: converted.sekAmountMinor,
    idempotencyKey: `dividend:${event.portfolioId}:${event.sourceEventKey}`,
  };
}
