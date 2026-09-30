import type {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
  FI_SHORT_INTEREST_PAGE_URL,
  FI_SHORT_INTEREST_PUBLISHER,
} from "@/lib/companies/short-interest/constants";
import type { FI_SHORT_INTEREST_COPY } from "@/lib/companies/short-interest/copy";

export type FiAggregatePosition = {
  issuerName: string;
  lei: string;
  percent: number;
  positionDate: string;
};

export type FiNamedShortPosition = {
  holder: string;
  issuerName: string;
  isin: string;
  percent: number;
  positionDate: string;
  comment: string | null;
};

export type FiShortInterestSource = {
  publisher: typeof FI_SHORT_INTEREST_PUBLISHER;
  pageUrl: typeof FI_SHORT_INTEREST_PAGE_URL;
  aggregateUrl: typeof FI_AGGREGATE_ODS_URL;
  currentPositionsUrl: typeof FI_CURRENT_POSITIONS_ODS_URL;
  fetchedAt: string | null;
};

export type FiShortInterestRegister = {
  aggregates: readonly FiAggregatePosition[];
  namedPositions: readonly FiNamedShortPosition[];
  source: FiShortInterestSource;
};

export type CompanyShortInterestStatus =
  | "present"
  | "absent"
  | "unmatched"
  | "ambiguous"
  | "unavailable";

export type CompanyShortInterest = {
  status: CompanyShortInterestStatus;
  /** Null unless a current aggregate row was matched. Never 0 for a missing row. */
  aggregatePercent: number | null;
  aggregatePercentLabel: string | null;
  aggregatePositionDate: string | null;
  issuerName: string | null;
  lei: string | null;
  namedPositions: readonly FiNamedShortPosition[];
  source: FiShortInterestSource;
  labels: {
    aggregate: typeof FI_SHORT_INTEREST_COPY.aggregateLabel;
    significantPositions: typeof FI_SHORT_INTEREST_COPY.significantPositionsLabel;
    source: typeof FI_SHORT_INTEREST_COPY.sourceLabel;
  };
  message: string | null;
  rules: {
    aggregate: typeof FI_SHORT_INTEREST_COPY.aggregateRule;
    significantPositions: typeof FI_SHORT_INTEREST_COPY.significantPositionRule;
    absenceIsNotZero: typeof FI_SHORT_INTEREST_COPY.absenceIsNotZero;
  };
  history: {
    supported: false;
    reason: typeof FI_SHORT_INTEREST_COPY.historyUnsupported;
  };
};

export type OdsCell = {
  text: string;
  value: string | null;
  valueType: string | null;
};
