/** Fixed courtage for every simulated model BUY and SELL: 10.00 SEK. */
export const MODEL_PORTFOLIO_COURTAGE_MINOR = 1_000;

export const MODEL_PORTFOLIO_COURTAGE_SEK = MODEL_PORTFOLIO_COURTAGE_MINOR / 100;

export function courtagePromptLine(): string {
  return (
    `COURTAGE: Varje genomförd modellköp och -sälj kostar exakt ${MODEL_PORTFOLIO_COURTAGE_SEK.toFixed(0)} SEK ` +
    `(${MODEL_PORTFOLIO_COURTAGE_MINOR} minor). Undvik churn och småaffärer där courtagen blir materiell.`
  );
}
