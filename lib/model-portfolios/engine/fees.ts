/** DivLab model portfolios do not charge simulated brokerage/courtage. */
export const SIMULATED_BUY_BROKERAGE_FEE_MINOR = 0;

export function buyBrokerageFeeMinor(side: "buy" | "sell"): number {
  void side;
  return SIMULATED_BUY_BROKERAGE_FEE_MINOR;
}
