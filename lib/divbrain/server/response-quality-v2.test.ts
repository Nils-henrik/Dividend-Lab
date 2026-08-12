import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DIVBRAIN_RESPONSE_FORMAT_VERSION,
  getDivBrainPolicyBlock,
  getDivBrainResponseFormatBlock,
} from "./policy";

describe("DivBrain Response Quality v3", () => {
  it("uses the v3 direct-first adaptive response contract", () => {
    const block = getDivBrainResponseFormatBlock();

    assert.equal(DIVBRAIN_RESPONSE_FORMAT_VERSION, 3);
    assert.equal(block.version, 3);
    assert.match(block.content, /Börja med själva svaret/);
    assert.match(block.content, /en enkel definitionsfråga ska normalt besvaras kort/);
    assert.match(block.content, /Gör inte en enkel fråga till en miniartikel/);
  });

  it("keeps follow-up continuity and ambiguity handling explicit", () => {
    const block = getDivBrainResponseFormatBlock();

    assert.match(block.content, /Vid följdfrågor/);
    assert.match(block.content, /redan etablerad samtalskontext/);
    assert.match(block.content, /tvetydig referens/);
    assert.match(block.content, /lämna utrymme för korrigering/);
  });

  it("keeps source synthesis and freshness honesty in trusted instructions", () => {
    const block = getDivBrainResponseFormatBlock();

    assert.match(block.content, /Skilj tidlös kunskap/);
    assert.match(block.content, /aktuell verifierad data saknas/);
    assert.match(block.content, /syntetisera relevant innehåll med egna ord/);
    assert.match(block.content, /numrerade citeringar/);
  });

  it("teaches multi-factor investment analysis without promising outcomes", () => {
    const block = getDivBrainResponseFormatBlock();

    assert.match(block.content, /affärskvalitet och kassaflöde/);
    assert.match(block.content, /Värdering är priset på framtida förväntningar/);
    assert.match(block.content, /nedsidan före uppsidan/);
    assert.match(block.content, /Sök aktivt efter motbevis/);
    assert.match(block.content, /ingen metod kan garantera vinst/);
  });

  it("preserves the deterministic current-data and advice boundaries", () => {
    const currentData = getDivBrainPolicyBlock(["require_current_data"]);
    assert.match(currentData.content, /påstå inte livevärden/);
    assert.match(currentData.content, /inte kan verifieras/);

    const advice = getDivBrainPolicyBlock(["no_personal_recommendation"]);
    assert.match(advice.content, /inga personliga köp-, sälj- eller allokeringsråd/);
  });
});
