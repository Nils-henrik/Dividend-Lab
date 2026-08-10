/** Simulated brokerage fee applied to every executed BUY or SELL. Exactly SEK 10.00. */
export const SIMULATED_BUY_BROKERAGE_FEE_MINOR = 1_000;

export function buyBrokerageFeeMinor(side: "buy" | "sell"): number {
  void side;
  return SIMULATED_BUY_BROKERAGE_FEE_MINOR;
}
