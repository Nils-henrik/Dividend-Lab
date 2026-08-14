import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDivLabAnalystAiConfig } from "../lib/analysis/analyst-auth";

describe("DivLab analyst AI auth resolution", () => {
  it("keeps explicit API-key auth as first priority", () => {
    const config = resolveDivLabAnalystAiConfig({
      AI_GATEWAY_API_KEY: "secret",
      VERCEL: "1",
    });
    assert.deepEqual(config, {
      configured: true,
      authMode: "api_key",
      primaryModel: "openai/gpt-5.6-luna",
      escalationModel: "openai/gpt-5.6-terra",
    });
  });

  it("keeps explicit OIDC auth when token is materialized", () => {
    const config = resolveDivLabAnalystAiConfig({ VERCEL_OIDC_TOKEN: "oidc" });
    assert.deepEqual(config, {
      configured: true,
      authMode: "vercel_oidc",
      primaryModel: "openai/gpt-5.6-luna",
      escalationModel: "openai/gpt-5.6-terra",
    });
  });

  it("allows a real Vercel preview runtime to attempt request-context OIDC", () => {
    const config = resolveDivLabAnalystAiConfig({
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_URL: "example-preview.vercel.app",
    });
    assert.deepEqual(config, {
      configured: true,
      authMode: "vercel_oidc",
      primaryModel: "openai/gpt-5.6-luna",
      escalationModel: "openai/gpt-5.6-terra",
    });
  });

  it("still fails closed in ordinary local or CI environments", () => {
    assert.deepEqual(resolveDivLabAnalystAiConfig({ CI: "true" }), {
      configured: false,
      reason: "gateway_auth_missing",
    });
  });
});
