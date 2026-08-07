/**
 * DivBrain Learning-aware context assembly (Ticket 1C-2).
 *
 * Retrieves relevant published DivLab Learning sources for an allowed user
 * request and delegates all trust/budget/delimiter enforcement to the existing
 * context assembler. Retrieved article prose never becomes trusted policy.
 *
 * Server-only — must never be imported by client components.
 */

import type { DivBrainResult } from "../../results";
import { assembleDivBrainContext } from "../context/assemble";
import type {
  DivBrainAssembledContext,
  DivBrainContextAssemblyInput,
} from "../context/types";
import { retrieveDivBrainLearningSources } from "./retrieve";
import type { DivBrainLearningRetrieveOptions } from "./types";

export type CreateDivBrainLearningContextAssemblerOptions = {
  /** Optional deterministic retrieval override for tests. */
  retrievalOptions?: DivBrainLearningRetrieveOptions;
};

/**
 * Retrieve Learning sources and assemble one provider-neutral DivBrain context.
 *
 * Existing caller-supplied sources are preserved and Learning sources are added
 * after them. The canonical assembler validates, deduplicates, budgets and wraps
 * every source as `untrusted_context`.
 */
export function assembleDivBrainLearningContext(
  input: DivBrainContextAssemblyInput,
  options: CreateDivBrainLearningContextAssemblerOptions = {},
): DivBrainResult<DivBrainAssembledContext> {
  const retrieval = retrieveDivBrainLearningSources(
    input.currentUserMessage,
    options.retrievalOptions,
  );

  if (!retrieval.ok) {
    return retrieval;
  }

  return assembleDivBrainContext({
    ...input,
    sources: [
      ...(input.sources ?? []),
      ...retrieval.data.sources,
    ],
  });
}

/**
 * Application-service compatible context assembler used by Internal Alpha.
 * Retrieval is local/deterministic and performs no model or network calls.
 */
export function createDivBrainLearningContextAssembler(
  options: CreateDivBrainLearningContextAssemblerOptions = {},
): {
  assemble(
    input: DivBrainContextAssemblyInput,
  ): DivBrainResult<DivBrainAssembledContext>;
} {
  return {
    assemble(input) {
      return assembleDivBrainLearningContext(input, options);
    },
  };
}
