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
 */
export type AnalysisEvidence = {
  id: string;
  sourceId: string;
  kind: AnalysisEvidenceKind;
  title: string;
  content: string;
  publishedAt: string;
  primary: boolean;
  documentRetrieved: boolean;
  reportPeriod: string | null;
  reportYear: number | null;
  documentType: string | null;
};
