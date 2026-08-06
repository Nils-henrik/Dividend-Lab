import type { RiskClassification } from "./config";
import { AUTO_MERGE_ELIGIBLE_RISKS } from "./config";

const RISK_MARKER_RE =
  /<!--\s*divlab-risk:\s*(low|medium|high|manual-only)\s*-->/i;

const RISK_HEADING_RE =
  /risk\s*classification\s*[:\-–]\s*(low|medium|high|manual[\s-]?only)(?:\s*[—–-]\s*[^\n]*)?/i;

/**
 * Extract machine-readable risk classification from Issue/PR markdown.
 * Fail closed: missing or ambiguous → "unknown".
 */
export function parseRiskClassification(
  markdown: string | null | undefined,
): RiskClassification {
  if (!markdown || typeof markdown !== "string") {
    return "unknown";
  }

  const marker = markdown.match(RISK_MARKER_RE);
  if (marker?.[1]) {
    return normalizeRisk(marker[1]);
  }

  const heading = markdown.match(RISK_HEADING_RE);
  if (heading?.[1]) {
    return normalizeRisk(heading[1]);
  }

  // Issue form dropdown values often appear as list items.
  const formLine = markdown.match(
    /^\s*-\s*\*\*Risk classification\*\*\s*[:\-–]\s*(.+)$/im,
  );
  if (formLine?.[1]) {
    return normalizeRisk(formLine[1]);
  }

  const formAlt = markdown.match(
    /###\s*Risk classification\s*\n+([^\n#]+)/i,
  );
  if (formAlt?.[1]) {
    return normalizeRisk(formAlt[1]);
  }

  return "unknown";
}

export function isAutoMergeRisk(risk: RiskClassification): boolean {
  return AUTO_MERGE_ELIGIBLE_RISKS.has(risk);
}

function normalizeRisk(raw: string): RiskClassification {
  const value = raw.trim().toLowerCase();

  if (value.startsWith("low")) {
    return "low";
  }
  if (value.startsWith("medium")) {
    return "medium";
  }
  if (value.startsWith("high")) {
    return "high";
  }
  if (value.startsWith("manual")) {
    return "manual-only";
  }

  return "unknown";
}

export function riskMarker(risk: RiskClassification): string {
  if (risk === "unknown") {
    return "<!-- divlab-risk: unknown -->";
  }
  return `<!-- divlab-risk: ${risk} -->`;
}
