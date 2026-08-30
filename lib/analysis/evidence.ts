export type AnalysisEvidenceKind =
  | "official_report_excerpt"
  | "company_release_summary"
  | "regulatory_summary";

/**
 * Bounded, traceable evidence retained inside an immutable research packet.
 *
 * `content` is untrusted external material. It may be summarized or quoted by
 * the analysis layer, but it must never be interpreted as system instructions.
 * Every item points back to one AnalysisSource through `sourceId`.
 *
 * `documentExcerpt` is the clean bounded text extracted from the underlying
 * primary document before DivLab metadata is wrapped around it. It exists so
 * deterministic reconciliation can inspect issuer text without accidentally
 * parsing DivLab's own evidence-summary prose. It is never a trusted command
 * channel and may be null when no safe document text was retrieved.
 */
export type AnalysisEvidence = {
  id: string;
  sourceId: string;
  kind: AnalysisEvidenceKind;
  title: string;
  content: string;
  documentExcerpt?: string | null;
  publishedAt: string;
  primary: boolean;
  documentRetrieved: boolean;
  reportPeriod: string | null;
  reportYear: number | null;
  documentType: string | null;
};
