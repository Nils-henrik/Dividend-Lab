import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDivLabAnalystAiConfig } from "../lib/analysis/analyst-auth";

const MODELS = {
  primary: "openai/gpt-5.6-luna",
  escalation: "openai/gpt-5.6-terra",
} as const;

const MISSING = {
  configured: false,
  reason: "gateway_auth_missing",
} as const;

describe("DivLab analyst AI auth resolution", () => {
  it("keeps explicit API-key auth as first priority", () => {
    const explicit = {
      configured: true,
      authMode: "api_key",
      primaryModel: MODELS.primary,
      escalationModel: MODELS.escalation,
    } as const;
    assert.deepEqual(
      resolveDivLabAnalystAiConfig({
        baseConfig: explicit,
        models: MODELS,
        env: { VERCEL: "1" },
      }),
      explicit,
    );
  });

  it("keeps explicit OIDC auth when token was already resolved", () => {
    const explicit = {
      configured: true,
      authMode: "vercel_oidc",
      primaryModel: MODELS.primary,
      escalationModel: MODELS.escalation,
    } as const;
    assert.deepEqual(
      resolveDivLabAnalystAiConfig({
        baseConfig: explicit,
        models: MODELS,
        env: {},
      }),
      explicit,
    );
  });

  it("allows a real Vercel preview runtime to attempt request-context OIDC", () => {
    assert.deepEqual(
      resolveDivLabAnalystAiConfig({
        baseConfig: MISSING,
        models: MODELS,
        env: {
          VERCEL: "1",
          VERCEL_ENV: "preview",
          VERCEL_URL: "example-preview.vercel.app",
        },
      }),
      {
        configured: true,
        authMode: "vercel_oidc",
        primaryModel: MODELS.primary,
        escalationModel: MODELS.escalation,
      },
    );
  });

  it("still fails closed in ordinary local or CI environments", () => {
    assert.deepEqual(
      resolveDivLabAnalystAiConfig({
        baseConfig: MISSING,
        models: MODELS,
        env: { CI: "true" },
      }),
      MISSING,
    );
  });
});
