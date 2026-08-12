/** DivLab model portfolios charge a fixed simulated brokerage fee on buys. */
export const SIMULATED_BUY_BROKERAGE_FEE_MINOR = 1_000;
export const SIMULATED_SELL_BROKERAGE_FEE_MINOR = 0;

export function buyBrokerageFeeMinor(side: "buy" | "sell"): number {
  return side === "buy"
    ? SIMULATED_BUY_BROKERAGE_FEE_MINOR
    : SIMULATED_SELL_BROKERAGE_FEE_MINOR;
}
