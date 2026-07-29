/**
 * DivBrain context assembly public server surface (Ticket 1A-4).
 *
 * Must never be imported by client components.
 */

export {
  assembleDivBrainContext,
  selectDivBrainContextHistory,
  selectDivBrainContextSources,
} from "./assemble";
export {
  neutralizeDivBrainDelimiterMarkers,
  sanitizeDivBrainContextDelimiterId,
  wrapUntrustedHistoryContent,
  wrapUntrustedSourceContent,
  wrapUntrustedToolResult,
  wrapUntrustedUserOwnedContext,
} from "./delimiters";
export {
  estimateDivBrainContextTokens,
  truncateToEstimatedTokenBudget,
} from "./estimate-size";
export {
  normalizeDivBrainContextAssemblyInput,
  normalizeDivBrainContextHistory,
  resolveDivBrainContextAssemblyConfig,
} from "./normalize";
export {
  mapAssembledContextToProviderRequest,
  snapshotAssembledContextArrays,
  type MapAssembledContextToProviderRequestOptions,
} from "./to-provider-request";
export type {
  DivBrainAssembledContext,
  DivBrainAssembledContextSection,
  DivBrainContextAssemblyConfig,
  DivBrainContextAssemblyDiagnostics,
  DivBrainContextAssemblyInput,
  DivBrainContextDiagnosticEntry,
  DivBrainContextExclusionReason,
  DivBrainContextHistoryRole,
  DivBrainContextHistoryTurnInput,
  DivBrainContextSectionKind,
  DivBrainContextTrustLevel,
  DivBrainNormalizedConversationTurn,
  DivBrainOptionalContextInput,
} from "./types";
export {
  DIVBRAIN_CONTEXT_HISTORY_ROLES,
  DIVBRAIN_CONTEXT_SECTION_KINDS,
  DIVBRAIN_CONTEXT_TRUST_LEVELS,
} from "./types";
