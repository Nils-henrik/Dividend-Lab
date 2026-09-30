import { formatSvNumber } from "@/lib/companies/valuation";

export const FI_SHORT_INTEREST_COPY = {
  aggregateLabel: "Summa rapporterad blankning",
  significantPositionsLabel: "Större publicerade positioner",
  sourceLabel: "Källa: Finansinspektionen",
  absent: "Ingen uppgift i FI:s aktuella blankningsregister.",
  aggregateRule:
    "Summan omfattar rapporterade korta nettopositioner som överstiger 0,1 procent av det emitterade aktiekapitalet. Positioner under 0,1 procent är inte anmälningspliktiga och ingår inte.",
  significantPositionRule:
    "Större publicerade positioner är betydande korta nettopositioner som har passerat 0,5 procent av det emitterade aktiekapitalet. För dem publiceras även positionsinnehavaren.",
  absenceIsNotZero: "Ingen uppgift i registret betyder inte att blankningen är 0 procent.",
  unmatched: "Bolaget saknar en entydig FI-identifierare, så blankning visas inte.",
  ambiguous: "FI-uppgiften kunde inte kopplas entydigt till bolaget.",
  unavailable: "FI:s blankningsregister kunde inte läsas.",
  historyUnsupported:
    "FI:s aggregerade blankningsregister är en aktuell ögonblicksbild. Historikfilen innehåller bara namngivna positioner över 0,5 procent och används inte som trend.",
} as const;

export function formatShortInterestPercent(percent: number | null): string | null {
  if (percent === null || !Number.isFinite(percent) || percent <= 0 || percent > 100) return null;
  const formatted = formatSvNumber(percent, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} %`;
}
