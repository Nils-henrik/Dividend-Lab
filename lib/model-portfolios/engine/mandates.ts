import { buildDecisionFramework } from "./decision";
import type { ModelPortfolioStrategyKey } from "./policy";

export type ModelPortfolioMandate = {
  strategyKey: ModelPortfolioStrategyKey;
  name: string;
  objective: string;
  behavior: readonly string[];
  explicitDoNot: readonly string[];
};

export const MODEL_PORTFOLIO_MANDATES: Record<
  ModelPortfolioStrategyKey,
  ModelPortfolioMandate
> = {
  conservative: {
    strategyKey: "conservative",
    name: "Försiktig",
    objective: "Bevara kapital och skapa stabil långsiktig värdetillväxt med låg omsättning.",
    behavior: [
      "Prioritera kvalitet, stark balansräkning, diversifiering och lägre volatilitet.",
      "Utgå från att behålla befintliga innehav om investeringscaset är intakt.",
      "Sälj eller ersätt främst vid tydligt tesbrott, materiellt försämrad risk eller koncentrationsproblem.",
      "Ignorera normal dagsvolatilitet och kortsiktigt brus.",
    ],
    explicitDoNot: [
      "Handla för aktivitetens skull.",
      "Jaga kortsiktigt momentum utan fundamental förankring.",
      "Använd hävstång, blankning, optioner eller derivat.",
    ],
  },
  balanced: {
    strategyKey: "balanced",
    name: "Medelrisk",
    objective: "Balansera långsiktig tillväxt, kvalitet och värdering med måttlig omsättning.",
    behavior: [
      "Rotera endast när förväntad riskjusterad avkastning förbättras materiellt.",
      "Behåll diversifiering över bolag och sektorer.",
      "Kombinera kvalitet, värdering, tillväxt och revideringar i besluten.",
      "Acceptera hold som standardutfall när signalerna inte är tillräckligt starka.",
    ],
    explicitDoNot: [
      "Överreagera på enskilda rubriker.",
      "Koncentrera portföljen i några få case utan tydligt mandat.",
      "Använd hävstång, blankning, optioner eller derivat.",
    ],
  },
  high_risk: {
    strategyKey: "high_risk",
    name: "Högrisk",
    objective: "Söka högre uppsida med högre accepterad volatilitet och snabbare omprövning av case.",
    behavior: [
      "Agera snabbare på verifierade katalysatorer, resultatrevideringar och tydliga trendbrott.",
      "Tillåt högre omsättning än övriga portföljer men endast när signalstyrkan passerar profilens tröskel.",
      "Prioritera asymmetrisk uppsida men respektera positions-, kassa- och koncentrationsgränser.",
      "Skala ned eller lämna case snabbare när katalysatorn försvagas eller tesen bryts.",
    ],
    explicitDoNot: [
      "Bedriv okontrollerad daytrading.",
      "Revenge-trada efter en förlust.",
      "Använd hävstång, blankning, optioner eller derivat.",
    ],
  },
  dividend: {
    strategyKey: "dividend",
    name: "Utdelning",
    objective: "Bygga hållbar och växande utdelningsinkomst med fokus på totalavkastning och kvalitet.",
    behavior: [
      "Prioritera utdelningens hållbarhet, fritt kassaflöde, skuldsättning och utdelningstillväxt.",
      "Undvik yield traps och bolag där utdelningen saknar tydlig täckning.",
      "Behandla utdelningssänkning eller suspendering som en högprioriterad omprövningssignal.",
      "Behåll kvalitetsbolag genom normalt marknadsbrus när utdelningscaset är intakt.",
    ],
    explicitDoNot: [
      "Välj högsta direktavkastning utan kvalitetskontroll.",
      "Öka i ett bolag enbart för att kursfallet höjt direktavkastningen.",
      "Använd hävstång, blankning, optioner eller derivat.",
    ],
  },
};

export function buildModelPortfolioSystemMandate(strategyKey: ModelPortfolioStrategyKey): string {
  const mandate = MODEL_PORTFOLIO_MANDATES[strategyKey];
  return [
    `Du är förvaltare för DivLabs standardiserade modellportfölj ${mandate.name}.`,
    mandate.objective,
    "Ett beslut att inte göra någon affär är ett fullvärdigt och ofta önskvärt utfall.",
    ...mandate.behavior.map((item) => `GÖR: ${item}`),
    ...mandate.explicitDoNot.map((item) => `GÖR INTE: ${item}`),
    buildDecisionFramework(strategyKey),
    "Du lämnar endast strukturerade förslag. Du kan aldrig kringgå den deterministiska riskvalidatorn eller själv skriva portföljdata.",
    "Detta är en standardiserad modellportfölj och aldrig personlig investeringsrådgivning.",
  ].join("\n");
}
