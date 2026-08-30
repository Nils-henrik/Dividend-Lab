import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import { parseDivBrainSources, type DivBrainSource } from "../../sources";
import {
  resolveSingleExplicitDivBrainAnalysisIdentity,
  type DivBrainAnalysisInstrumentIdentity,
} from "./identity";

export const DIVBRAIN_ANALYSIS_KNOWLEDGE_VERSION =
  "divbrain-analysis-knowledge-v1" as const;

export const DIVBRAIN_ANALYSIS_KNOWLEDGE_MAX_SOURCES = 3;

export type DivBrainApprovedAnalysisSourceLoader = (
  identity: DivBrainAnalysisInstrumentIdentity,
) => Promise<DivBrainResult<readonly DivBrainSource[]>>;

export type DivBrainAnalysisKnowledgeRetriever = {
  retrieve(input: {
    currentUserMessage: string;
  }): Promise<DivBrainResult<readonly DivBrainSource[]>>;
};

/**
 * Build a bounded, fail-closed DivLab Analysis knowledge retriever.
 *
 * The loader is never called unless exactly one explicit instrument identity is
 * present. Multiple instruments deliberately return no analysis sources until
 * DivBrain has a comparison-aware source budget/assembler.
 */
export function createDivBrainAnalysisKnowledgeRetriever(input: {
  loadApprovedSources: DivBrainApprovedAnalysisSourceLoader;
}): DivBrainAnalysisKnowledgeRetriever {
  if (typeof input?.loadApprovedSources !== "function") {
    throw new Error("divbrain_analysis_source_loader_required");
  }

  return {
    async retrieve({ currentUserMessage }) {
      const identity = resolveSingleExplicitDivBrainAnalysisIdentity(currentUserMessage);
      if (!identity) return divBrainSuccess([]);

      let loaded: DivBrainResult<readonly DivBrainSource[]>;
      try {
        loaded = await input.loadApprovedSources(identity);
      } catch {
        return divBrainFailureFromCode("internal_error");
      }
      if (!loaded.ok) return loaded;

      const parsed = parseDivBrainSources(
        [...loaded.data].slice(0, DIVBRAIN_ANALYSIS_KNOWLEDGE_MAX_SOURCES),
      );
      if (!parsed.ok) return parsed;
      return divBrainSuccess(parsed.data);
    },
  };
}
