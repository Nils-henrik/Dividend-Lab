/**
 * DivBrain Ticket 1C-2 — Learning context wiring tests.
 *
 * Pure/local only: no provider generation, network, database, or paid calls.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDivBrainAlphaApplicationServiceDeps } from "../access/wiring";
import { assembleDivBrainContext } from "../context/assemble";
import { mapAssembledContextToProviderRequest } from "../context/to-provider-request";
import { createUnconfiguredProvider } from "../providers/unconfigured-provider";
import type { DivBrainConversationRepository } from "../repository/repository";
import {
  assembleDivBrainLearningContext,
  createDivBrainLearningContextAssembler,
} from "./context-assembler";

const repository = {} as DivBrainConversationRepository;

describe("DivBrain Learning-aware context assembly", () => {
  it("grounds an indexfond question in the published Learning corpus", () => {
    const result = assembleDivBrainLearningContext({
      currentUserMessage: "Vad är en indexfond?",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.ok(result.data.includedSources.length >= 1);
    const source = result.data.includedSources[0];
    assert.equal(source?.id, "learning:vad-ar-en-indexfond");
    assert.equal(source?.internalRoute, "/learning/vad-ar-en-indexfond");
    assert.equal(source?.category, "divlab_learning");

    const sourceSections = result.data.sections.filter(
      (section) => section.sourceId === source?.id,
    );
    assert.ok(sourceSections.length >= 1);
    for (const section of sourceSections) {
      assert.equal(section.trust, "untrusted_context");
    }
  });

  it("keeps unrelated questions honestly ungrounded", () => {
    const result = assembleDivBrainLearningContext({
      currentUserMessage: "Hur byter man tändstift på en veteranmotorcykel?",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.data.includedSources, []);
  });

  it("carries retained Learning sources into the provider request contract", () => {
    const assembled = createDivBrainLearningContextAssembler().assemble({
      currentUserMessage: "Förklara FIRE och ekonomisk frihet.",
    });

    assert.equal(assembled.ok, true);
    if (!assembled.ok) return;

    const request = mapAssembledContextToProviderRequest(assembled.data, {
      timeoutMs: 30_000,
    });
    assert.equal(request.ok, true);
    if (!request.ok) return;

    assert.ok(request.data.sources.length >= 1);
    assert.equal(request.data.sources[0]?.id, "learning:fire-ekonomisk-frihet");
    assert.equal(
      request.data.contextBlocks.some(
        (block) =>
          (block.kind === "sources" || block.kind === "knowledge") &&
          block.content.includes("UNTRUSTED_SOURCE"),
      ),
      true,
    );
  });
});

describe("DivBrain Alpha Learning context wiring", () => {
  it("uses Learning-aware context assembly by default", () => {
    const deps = createDivBrainAlphaApplicationServiceDeps({
      repository,
      provider: createUnconfiguredProvider(),
    });

    const result = deps.contextAssembler.assemble({
      currentUserMessage: "Vad är en indexfond?",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(
      result.data.includedSources.some(
        (source) => source.id === "learning:vad-ar-en-indexfond",
      ),
      true,
    );
  });

  it("preserves an explicit server-side context assembler override", () => {
    const explicitContextAssembler = {
      assemble: assembleDivBrainContext,
    };
    const deps = createDivBrainAlphaApplicationServiceDeps({
      repository,
      provider: createUnconfiguredProvider(),
      contextAssembler: explicitContextAssembler,
    });

    assert.equal(deps.contextAssembler, explicitContextAssembler);
    const result = deps.contextAssembler.assemble({
      currentUserMessage: "Vad är en indexfond?",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.data.includedSources, []);
  });
});
