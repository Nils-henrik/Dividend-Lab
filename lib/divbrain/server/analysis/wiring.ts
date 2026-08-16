import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import {
  createDivBrainAnalysisKnowledgeRetriever,
  type DivBrainAnalysisKnowledgeRetriever,
} from "./knowledge";
import { retrieveLatestDivLabAnalysisSources } from "./retrieve";

export type CreateDivBrainAnalysisKnowledgeWiringOptions = {
  onMissingConfiguration?: () => void;
  onClientCreationThrow?: () => void;
};

/**
 * Build the narrow privileged DivLab Analysis knowledge adapter used by
 * DivBrain. The raw service-role client never leaves this closure.
 */
export function createDivBrainServiceRoleAnalysisKnowledgeRetriever(
  options: CreateDivBrainAnalysisKnowledgeWiringOptions = {},
): DivBrainResult<DivBrainAnalysisKnowledgeRetriever> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    typeof supabaseUrl !== "string" ||
    !supabaseUrl.trim() ||
    typeof serviceRoleKey !== "string" ||
    !serviceRoleKey.trim()
  ) {
    options.onMissingConfiguration?.();
    return divBrainFailureFromCode("internal_error");
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    return divBrainSuccess(
      createDivBrainAnalysisKnowledgeRetriever({
        async loadApprovedSources(identity) {
          const result = await retrieveLatestDivLabAnalysisSources({
            supabase,
            symbol: identity.symbol,
            exchange: identity.exchange,
          });
          if (!result.ok) return result;
          return divBrainSuccess(result.data.sources);
        },
      }),
    );
  } catch {
    options.onClientCreationThrow?.();
    return divBrainFailureFromCode("internal_error");
  }
}
