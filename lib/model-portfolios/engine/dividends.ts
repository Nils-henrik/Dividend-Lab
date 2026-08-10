import {
  convertNativeMinorToSek,
  isSupportedTradeCurrency,
  type FxRateToSek,
  type SupportedTradeCurrency,
} from "./fx";

export const DIVIDEND_IDEMPOTENCY_PREFIX = "dividend:";

/**
 * Verified corporate-action dividend payment. Never invent events —
 * only credit when provider/company data is present and verified.
 */
export type VerifiedDividendPayment = {
  portfolioId: string;
  instrumentSymbol: string;
  exchange: string;
  instrumentName: string;
  /** Stable provider/corporate-action payment identity. */
  paymentEventId: string;
  paymentDate: string;
  /** Dividend per share in native minor units, or total native minor if quantityAlreadyApplied. */
  nativeAmountMinor: number;
  nativeCurrency: string;
  /** Holding quantity on record date / payment calculation basis. */
  quantity: number;
  fxRateToSek?: FxRateToSek | null;
  sourcePublisher: string;
  verifiedAt: string;
  rationale?: string;
};

export type DividendCreditPlan = {
  idempotencyKey: string;
  portfolioId: string;
  instrumentSymbol: string;
  exchange: string;
  instrumentName: string;
  quantity: number;
  nativeCurrency: SupportedTradeCurrency;
  nativeAmountMinor: number;
  fxToSek: number;
  /** SEK credit to cash (minor). */
  grossAmountMinor: number;
  feeMinor: 0;
  paymentDate: string;
  marketDataAsOf: string;
  rationale: string;
  /** Cash ledger external key (same as idempotency for dividends). */
  cashExternalKey: string;
};

export type DividendCreditResult =
  | { ok: true; plan: DividendCreditPlan }
  | { ok: true; alreadyCredited: true; idempotencyKey: string }
  | {
      ok: false;
      reason:
        | "unverified"
        | "invalid_payment"
        | "unsupported_currency"
        | "fx_required"
        | "invalid_fx"
        | "zero_amount"
        | "invalid_quantity";
    };

export function dividendIdempotencyKey(input: {
  portfolioId: string;
  instrumentSymbol: string;
  exchange: string;
  paymentEventId: string;
}): string {
  return `${DIVIDEND_IDEMPOTENCY_PREFIX}${[
    input.portfolioId,
    input.instrumentSymbol.toUpperCase(),
    input.exchange.toUpperCase(),
    input.paymentEventId,
  ].join(":")}`;
}

export function planDividendCredit(input: {
  payment: VerifiedDividendPayment;
  /** True when a transaction/ledger row with the same idempotency key already exists. */
  alreadyCredited: boolean;
}): DividendCreditResult {
  const { payment } = input;
  const idempotencyKey = dividendIdempotencyKey({
    portfolioId: payment.portfolioId,
    instrumentSymbol: payment.instrumentSymbol,
    exchange: payment.exchange,
    paymentEventId: payment.paymentEventId,
  });

  if (input.alreadyCredited) {
    return { ok: true, alreadyCredited: true, idempotencyKey };
  }

  if (
    !payment.portfolioId.trim() ||
    !payment.instrumentSymbol.trim() ||
    !payment.exchange.trim() ||
    !payment.instrumentName.trim() ||
    !payment.paymentEventId.trim() ||
    !payment.paymentDate.trim() ||
    !payment.sourcePublisher.trim() ||
    !payment.verifiedAt.trim()
  ) {
    return { ok: false, reason: "unverified" };
  }

  if (!Number.isFinite(payment.quantity) || payment.quantity <= 0) {
    return { ok: false, reason: "invalid_quantity" };
  }

  if (!Number.isFinite(payment.nativeAmountMinor) || payment.nativeAmountMinor <= 0) {
    return { ok: false, reason: "zero_amount" };
  }

  if (!isSupportedTradeCurrency(payment.nativeCurrency)) {
    return { ok: false, reason: "unsupported_currency" };
  }

  // nativeAmountMinor is treated as per-share dividend in native minor units.
  const totalNativeMinor = Math.round(payment.nativeAmountMinor * payment.quantity);
  if (totalNativeMinor <= 0) {
    return { ok: false, reason: "zero_amount" };
  }

  const converted = convertNativeMinorToSek({
    nativeMinor: totalNativeMinor,
    nativeCurrency: payment.nativeCurrency,
    fxRateToSek: payment.fxRateToSek,
  });

  if (!converted.ok) {
    return {
      ok: false,
      reason:
        converted.reason === "invalid_amount"
          ? "invalid_payment"
          : converted.reason,
    };
  }

  if (converted.sekMinor <= 0) {
    return { ok: false, reason: "zero_amount" };
  }

  const rationale =
    payment.rationale?.trim() ||
    `Verifierad utdelning ${payment.instrumentSymbol} (${payment.paymentEventId})`;

  return {
    ok: true,
    plan: {
      idempotencyKey,
      portfolioId: payment.portfolioId,
      instrumentSymbol: payment.instrumentSymbol,
      exchange: payment.exchange,
      instrumentName: payment.instrumentName,
      quantity: payment.quantity,
      nativeCurrency: converted.nativeCurrency,
      nativeAmountMinor: converted.nativeMinor,
      fxToSek: converted.fxToSek,
      grossAmountMinor: converted.sekMinor,
      feeMinor: 0,
      paymentDate: payment.paymentDate,
      marketDataAsOf: payment.verifiedAt,
      rationale,
      cashExternalKey: idempotencyKey,
    },
  };
}
