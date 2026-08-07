import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateChecks,
  isApprovalWorkflowCheckName,
} from "./merge-eligibility";

describe("Cursor approval self-check handling", () => {
  it("recognizes the approval workflow check name", () => {
    assert.equal(isApprovalWorkflowCheckName("Validate and squash-merge"), true);
    assert.equal(
      isApprovalWorkflowCheckName(
        "Cursor PR Approval / Validate and squash-merge",
      ),
      true,
    );
    assert.equal(isApprovalWorkflowCheckName("Vercel"), false);
  });

  it("ignores its own in-progress check when independent checks are green", () => {
    const decision = evaluateChecks({
      requiredChecks: [
        {
          name: "Validate and squash-merge",
          status: "in_progress",
          conclusion: null,
        },
        {
          name: "Vercel",
          status: "completed",
          conclusion: "success",
        },
      ],
      vercelCheck: {
        name: "Vercel",
        status: "completed",
        conclusion: "success",
      },
    });

    assert.equal(decision.allowed, true);
  });

  it("still fails closed when no independent required check exists", () => {
    const decision = evaluateChecks({
      requiredChecks: [
        {
          name: "Validate and squash-merge",
          status: "in_progress",
          conclusion: null,
        },
      ],
      vercelCheck: {
        name: "Vercel",
        status: "completed",
        conclusion: "success",
      },
    });

    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.reason, "checks_not_ready");
    }
  });
});
