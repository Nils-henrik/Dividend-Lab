/** Simulated brokerage fee applied to every executed BUY. Exactly SEK 10.00. */
export const SIMULATED_BUY_BROKERAGE_FEE_MINOR = 1_000;

export function buyBrokerageFeeMinor(side: "buy" | "sell"): number {
  return side === "buy" ? SIMULATED_BUY_BROKERAGE_FEE_MINOR : 0;
}
