import { z } from "zod";
import { divLabAnalystDraftSchema } from "./analyst-schema";
import { DIVLAB_PEER_ANALYST_CONTEXT_VERSION } from "./peer-analyst-context";

export const DIVLAB_PEER_ANALYST_SCHEMA_VERSION = "analyst-v3-peer" as const;

export const divLabPeerAnalystMetricSchema = z.enum([
  "pe",
  "priceToFcf",
  "evToEbit",
  "evToEbitda",
]);

const peerAuditId = z.string().uuid();

export const divLabPeerAnalystClaimSchema = z.object({
  metric: divLabPeerAnalystMetricSchema,
  text: z.string().trim().min(1).max(900),
  peerAuditId,
  targetValue: z.number().finite().positive(),
  peerSampleSize: z.number().int().min(3).max(25),
  peerMedian: z.number().finite().positive(),
  peerMin: z.number().finite().positive(),
  peerMax: z.number().finite().positive(),
  targetVsMedianPct: z.number().finite(),
});

const peerExtensionSchema = z
  .object({
    peerContextVersion: z.literal(DIVLAB_PEER_ANALYST_CONTEXT_VERSION),
    peerAuditId,
    peerInterpretation: z.array(divLabPeerAnalystClaimSchema).min(1).max(4),
  })
  .superRefine((draft, ctx) => {
    const metrics = draft.peerInterpretation.map((claim) => claim.metric);
    if (new Set(metrics).size !== metrics.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["peerInterpretation"],
        message: "peer_interpretation_metric_must_be_unique",
      });
    }
    for (const [index, claim] of draft.peerInterpretation.entries()) {
      if (claim.peerAuditId !== draft.peerAuditId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["peerInterpretation", index, "peerAuditId"],
          message: "peer_interpretation_audit_id_must_match_draft",
        });
      }
      if (claim.peerMin > claim.peerMedian || claim.peerMedian > claim.peerMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["peerInterpretation", index],
          message: "peer_interpretation_range_invalid",
        });
      }
    }
  });

/**
 * Analyst v3-peer deliberately composes the established analyst-v2 target-company
 * schema instead of replacing it. Target-company claims still carry ordinary
 * `sourceIds`; peer claims live in a separate section and reference one immutable
 * peer-audit UUID instead.
 */
export const divLabPeerAnalystDraftSchema = z.intersection(
  divLabAnalystDraftSchema,
  peerExtensionSchema,
);

export type DivLabPeerAnalystMetric = z.infer<typeof divLabPeerAnalystMetricSchema>;
export type DivLabPeerAnalystClaim = z.infer<typeof divLabPeerAnalystClaimSchema>;
export type DivLabPeerAnalystDraft = z.infer<typeof divLabPeerAnalystDraftSchema>;
