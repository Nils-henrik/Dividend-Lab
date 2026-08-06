import { BRIDGE_LABELS } from "./config.ts";

export interface LabelDefinition {
  name: string;
  color: string;
  description: string;
}

/**
 * Idempotent label bootstrap definitions for the Cursor bridge.
 * Colors are GitHub hex without '#'.
 */
export const BRIDGE_LABEL_DEFINITIONS: readonly LabelDefinition[] = [
  {
    name: BRIDGE_LABELS.agent,
    color: "1D76DB",
    description:
      "Dispatch this Issue to a Cursor Cloud Agent (DivLab automation bridge).",
  },
  {
    name: BRIDGE_LABELS.running,
    color: "FBCA04",
    description:
      "A Cursor Cloud Agent has been dispatched for this Issue and may still be running.",
  },
  {
    name: BRIDGE_LABELS.failed,
    color: "D93F0B",
    description:
      "Cursor Cloud Agent dispatch failed. Inspect the Issue comment, fix, then re-apply cursor-agent.",
  },
  {
    name: BRIDGE_LABELS.approved,
    color: "0E8A16",
    description:
      "Explicit DivLab release gate: attempt controlled squash-merge of an eligible Cursor PR.",
  },
  {
    name: BRIDGE_LABELS.manualReview,
    color: "B60205",
    description:
      "Automatic merge refused. Manual review required (sensitive paths, high risk, or ambiguous state).",
  },
] as const;
