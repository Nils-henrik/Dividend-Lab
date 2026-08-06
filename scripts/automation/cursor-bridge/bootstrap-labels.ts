import {
  LABEL_CURSOR_AGENT,
  LABEL_CURSOR_FAILED,
  LABEL_CURSOR_RUNNING,
  LABEL_DIVLAB_APPROVED,
  LABEL_DIVLAB_MANUAL_REVIEW,
} from "./config";
import { createLabelIfMissing } from "./github-api";

const BRIDGE_LABELS = [
  {
    name: LABEL_CURSOR_AGENT,
    color: "1d76db",
    description: "Dispatch this issue to Cursor Cloud Agent via GitHub Actions",
  },
  {
    name: LABEL_CURSOR_RUNNING,
    color: "fbca04",
    description: "Cursor Cloud Agent is running for this issue",
  },
  {
    name: LABEL_CURSOR_FAILED,
    color: "d93f0b",
    description: "Cursor Cloud Agent dispatch failed for this issue",
  },
  {
    name: LABEL_DIVLAB_APPROVED,
    color: "0e8a16",
    description: "Explicit approval gate for automated squash-merge of eligible Cursor PRs",
  },
  {
    name: LABEL_DIVLAB_MANUAL_REVIEW,
    color: "b60205",
    description: "Requires manual human review before merge",
  },
];

export function bootstrapLabels(): void {
  for (const label of BRIDGE_LABELS) {
    createLabelIfMissing(label);
    console.log(`Label ready: ${label.name}`);
  }
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "")) {
  bootstrapLabels();
}
