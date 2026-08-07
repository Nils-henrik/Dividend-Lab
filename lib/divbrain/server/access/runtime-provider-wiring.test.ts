/**
 * DivBrain Ticket 1B-2 — runtime provider selection wiring tests.
 *
 * No provider generation is invoked here; these tests only verify server-side
 * dependency selection and fail-closed defaults.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DivBrainConversationRepository } from "../repository/repository";
import { DIVBRAIN_PROVIDER_UNCONFIGURED_ID } from "../providers/types";
import { createDivBrainAlphaApplicationServiceDeps } from "./wiring";

const PROVIDER_ENV_KEYS = [
  "DIVBRAIN_PROVIDER",
  "DIVBRAIN_PROVIDER_MODEL",
  "DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS",
] as const;

function withProviderEnv(
  values: Partial<Record<(typeof PROVIDER_ENV_KEYS)[number], string>>,
  run: () => void,
): void {
  const previous = new Map<string, string | undefined>();

  for (const key of PROVIDER_ENV_KEYS) {
    previous.set(key, process.env[key]);
    const value = values[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    run();
  } finally {
    for (const key of PROVIDER_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

const repository = {} as DivBrainConversationRepository;

describe("DivBrain Alpha runtime provider selection", () => {
  it("fails closed to UnconfiguredProvider when provider config is absent", () => {
    withProviderEnv({}, () => {
      const deps = createDivBrainAlphaApplicationServiceDeps({ repository });
      assert.equal(deps.provider.id, DIVBRAIN_PROVIDER_UNCONFIGURED_ID);
    });
  });

  it("selects AI Gateway only from explicit valid server configuration", () => {
    withProviderEnv(
      {
        DIVBRAIN_PROVIDER: "ai-gateway",
        DIVBRAIN_PROVIDER_MODEL: "openai/gpt-5.6-luna",
        DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS: "256",
      },
      () => {
        const deps = createDivBrainAlphaApplicationServiceDeps({ repository });
        assert.equal(deps.provider.id, "ai-gateway");

        const provider = deps.provider as typeof deps.provider & {
          getModelId?: () => string;
          getMaxOutputTokens?: () => number;
        };
        assert.equal(provider.getModelId?.(), "openai/gpt-5.6-luna");
        assert.equal(provider.getMaxOutputTokens?.(), 256);
      },
    );
  });

  it("fails closed on malformed server configuration", () => {
    withProviderEnv(
      {
        DIVBRAIN_PROVIDER: "ai-gateway",
        DIVBRAIN_PROVIDER_MODEL: "browser supplied nonsense",
      },
      () => {
        const deps = createDivBrainAlphaApplicationServiceDeps({ repository });
        assert.equal(deps.provider.id, DIVBRAIN_PROVIDER_UNCONFIGURED_ID);
      },
    );
  });

  it("preserves an explicit server-side provider override", () => {
    const explicitProvider = {
      id: "test-provider",
      async generate() {
        return { status: "cancelled" as const };
      },
    };

    const deps = createDivBrainAlphaApplicationServiceDeps({
      repository,
      provider: explicitProvider,
    });

    assert.equal(deps.provider, explicitProvider);
  });
});
