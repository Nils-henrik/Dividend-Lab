import type Decimal from "decimal.js-light";
import type {
  GavCalculationResult,
  GavEvent,
  GavEventType,
} from "./types";

export const GAV_EVENT_LABELS: Record<GavEventType, string> = {
  purchase: "Köp",
  sale: "Försäljning",
  split: "Split eller fondemission",
  reverseSplit: "Omvänd split",
};

function localizeFixed(value: Decimal, decimals: number, trim: boolean) {
  let fixed = value.toFixed(decimals);
  if (/^-0(?:\.0+)?$/.test(fixed)) {
    fixed = fixed.slice(1);
  }

  let [integer, fraction = ""] = fixed.split(".");
  const sign = integer.startsWith("-") ? "-" : "";
  integer = integer.replace("-", "");
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

  if (trim && fraction) {
    fraction = fraction.replace(/0+$/, "");
  }

  return `${sign}${integer}${fraction ? `,${fraction}` : ""}`;
}

export function formatMoney(value: Decimal): string {
  return `${localizeFixed(value, 2, false)} kr`;
}

export function formatGav(value: Decimal, showMoreDecimals = false): string {
  return `${localizeFixed(value, showMoreDecimals ? 6 : 2, showMoreDecimals)} kr`;
}

export function formatQuantity(value: Decimal): string {
  return localizeFixed(value, 8, true);
}

export function formatPercent(value: Decimal): string {
  return `${localizeFixed(value, 2, false)} %`;
}

export function formatDecimalForCsv(
  value: Decimal | null,
  decimals = 8,
): string {
  return value ? localizeFixed(value, decimals, true) : "—";
}

export function escapeCsvCell(
  value: string,
  userControlled = false,
): string {
  const neutralized =
    userControlled && /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

function eventDetails(event: GavEvent): string {
  if (event.type === "split" || event.type === "reverseSplit") {
    return `Varje ${event.oldUnits} gamla blir ${event.newUnits} nya`;
  }
  const action = event.type === "purchase" ? "Köp" : "Försäljning";
  return `${action}: ${event.quantity} till ${event.price} kr, courtage ${event.fee || "0"} kr`;
}

export function buildGavCsv(input: {
  securityName: string;
  events: GavEvent[];
  calculation: GavCalculationResult;
}): string {
  const { calculation, events, securityName } = input;
  if (!calculation.summary) {
    return "";
  }

  const rows: string[][] = [
    ["Värdepapper", securityName || "Ej angivet"],
    [],
    [
      "Händelse",
      "Datum",
      "Typ",
      "Detaljer",
      "Antal efter",
      "Omkostnadsbelopp efter (SEK)",
      "GAV efter (SEK)",
      "Realiserat resultat (SEK)",
    ],
  ];

  for (const step of calculation.steps) {
    const event = events.find((item) => item.id === step.eventId);
    if (!event) {
      continue;
    }
    rows.push([
      String(step.eventNumber),
      event.date,
      GAV_EVENT_LABELS[step.type],
      eventDetails(event),
      formatDecimalForCsv(step.quantity),
      formatDecimalForCsv(step.totalCostBasis, 2),
      formatDecimalForCsv(step.gav, 8),
      formatDecimalForCsv(step.realizedResult, 2),
    ]);
  }

  rows.push(
    [],
    [
      "Slutresultat",
      "",
      "",
      securityName || "Ej angivet",
      formatDecimalForCsv(calculation.summary.quantity),
      formatDecimalForCsv(calculation.summary.totalCostBasis, 2),
      formatDecimalForCsv(calculation.summary.gav, 8),
      formatDecimalForCsv(calculation.summary.realizedResult, 2),
    ],
    [],
    [
      "Information",
      "DivLabs GAV-kalkylator är ett hjälpmedel och inte ett officiellt deklarationsunderlag.",
    ],
  );

  return `\ufeff${rows
    .map((row, rowIndex) =>
      row
        .map((cell, columnIndex) =>
          escapeCsvCell(
            cell,
            (rowIndex === 0 && columnIndex === 1) ||
              columnIndex === 1 ||
              columnIndex === 3,
          ),
        )
        .join(";"),
    )
    .join("\r\n")}`;
}
