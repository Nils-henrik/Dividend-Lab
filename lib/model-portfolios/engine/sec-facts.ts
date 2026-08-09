import "server-only";

const SEC_COMPANY_FACTS_BASE = "https://data.sec.gov/api/xbrl/companyfacts";
const SEC_USER_AGENT = "DivLab research bot (https://divlab.se/contact)";
const REVALIDATE_SECONDS = 900;

export type SecFactPoint = {
  concept: string;
  label: string;
  unit: string;
  value: number;
  end: string;
  filed: string;
  form: string;
  fiscalYear: number | null;
  fiscalPeriod: string | null;
};

type FactUnitPoint = {
  val?: unknown;
  end?: unknown;
  filed?: unknown;
  form?: unknown;
  fy?: unknown;
  fp?: unknown;
};

type CompanyFactConcept = {
  label?: unknown;
  units?: Record<string, FactUnitPoint[]>;
};

type CompanyFactsPayload = {
  entityName?: unknown;
  facts?: {
    "us-gaap"?: Record<string, CompanyFactConcept>;
  };
};

const CONCEPTS = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "Revenues",
  "NetIncomeLoss",
  "OperatingIncomeLoss",
  "NetCashProvidedByUsedInOperatingActivities",
  "PaymentsToAcquirePropertyPlantAndEquipment",
  "Assets",
  "Liabilities",
  "CashAndCashEquivalentsAtCarryingValue",
  "LongTermDebtCurrent",
  "LongTermDebtNoncurrent",
  "EarningsPerShareDiluted",
  "PaymentsOfDividendsCommonStock",
] as const;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function number(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function latestComparable(points: readonly FactUnitPoint[]): FactUnitPoint | null {
  const usable = points.filter((point) => {
    const form = text(point.form);
    return Boolean(number(point.val) !== null && text(point.end) && text(point.filed) && form && ["10-K", "10-Q", "20-F", "40-F", "6-K"].includes(form));
  });
  return usable.sort((a, b) => {
    const end = String(b.end).localeCompare(String(a.end));
    if (end !== 0) return end;
    return String(b.filed).localeCompare(String(a.filed));
  })[0] ?? null;
}

export function extractLatestSecFacts(payload: CompanyFactsPayload): SecFactPoint[] {
  const gaap = payload.facts?.["us-gaap"] ?? {};
  const results: SecFactPoint[] = [];

  for (const concept of CONCEPTS) {
    const fact = gaap[concept];
    if (!fact?.units) continue;
    const preferredUnits = Object.keys(fact.units).sort((a, b) => {
      const aScore = a === "USD" ? 0 : a === "USD/shares" ? 1 : 2;
      const bScore = b === "USD" ? 0 : b === "USD/shares" ? 1 : 2;
      return aScore - bScore;
    });
    for (const unit of preferredUnits) {
      const point = latestComparable(fact.units[unit] ?? []);
      if (!point) continue;
      const value = number(point.val);
      const end = text(point.end);
      const filed = text(point.filed);
      const form = text(point.form);
      if (value === null || !end || !filed || !form) continue;
      results.push({
        concept,
        label: text(fact.label) ?? concept,
        unit,
        value,
        end,
        filed,
        form,
        fiscalYear: number(point.fy),
        fiscalPeriod: text(point.fp),
      });
      break;
    }
  }

  return results;
}

export function summarizeSecFacts(entityName: string, facts: readonly SecFactPoint[]): string {
  const compact = facts.slice(0, 14).map((fact) => {
    const fiscal = [fact.fiscalYear, fact.fiscalPeriod].filter(Boolean).join(" ");
    return `${fact.label}: ${fact.value} ${fact.unit} | period slut ${fact.end} | ${fact.form}${fiscal ? ` | ${fiscal}` : ""}`;
  });
  return [`SEC XBRL Company Facts för ${entityName}.`, ...compact].join("\n");
}

export async function fetchSecCompanyFacts(cik: string): Promise<{ entityName: string; facts: SecFactPoint[] }> {
  const normalized = cik.padStart(10, "0");
  if (!/^\d{10}$/.test(normalized)) throw new Error("invalid_sec_cik");
  const response = await fetch(`${SEC_COMPANY_FACTS_BASE}/CIK${normalized}.json`, {
    headers: { Accept: "application/json", "User-Agent": SEC_USER_AGENT },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error(`sec_companyfacts_http_${response.status}`);
  const payload = (await response.json()) as CompanyFactsPayload;
  const entityName = text(payload.entityName) ?? `CIK ${normalized}`;
  return { entityName, facts: extractLatestSecFacts(payload) };
}
