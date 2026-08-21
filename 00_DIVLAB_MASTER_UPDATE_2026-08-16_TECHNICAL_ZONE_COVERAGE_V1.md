# DivLab Master Update — Technical Zone Coverage v1

Date: 2026-08-16
Status: Preview release candidate / fail-closed

## Runtime finding

The fifth real Atlas Copco A Preview run again reached:

- Research quality: 91/100
- Analyst quality: 100/100
- Analyst view: neutral
- Risk / confidence: medium / medium
- sole failed Research check: `technicalLevelCoverage`

This confirms the qualitative-primary-research and Analyst-quality paths are now stable. The remaining blocker is deterministic technical-level coverage only.

## Technical Zone Coverage v1

Earlier hardening already made support/resistance more zone-like without lowering the gate:

- raw zone tolerance remains derived from current price and ATR/median daily range;
- pivot clustering uses a bounded overlap envelope of 1.35x raw tolerance;
- merged clusters have a hard maximum spread of 2.4x raw tolerance;
- rendered zone envelopes use 0.45x raw tolerance around the center;
- zone acceptance is unchanged: at least two pivot reactions or the existing strength threshold;
- an isolated historical wick no longer falsely blocks a legitimate price-discovery state when no validated resistance zone exists.

## Raw OHLC price-plane correction

The fifth runtime exposed the deeper issue: the support/resistance engine mixed two different price bases.

Yahoo history supplies raw OHLC (`open/high/low/close`) plus a separate dividend/split-adjusted close. The technical engine previously built pivot levels from raw `high/low` while using `adjustedClose` for the current close, ATR previous close and prior closing high. After dividends or corporate actions this can shift the current-price plane relative to the pivot-price plane and make valid support/resistance appear to be missing.

Support/resistance now uses **raw close consistently with raw OHLC** for:

- current technical price;
- ATR/true-range previous close;
- prior closing high used by price-discovery detection;
- support/resistance distance calculations.

`adjustedClose` remains available elsewhere for return/split continuity, but it is no longer mixed into raw OHLC technical levels.

A deterministic regression test intentionally creates a material gap between raw close and adjusted close and requires the engine to retain the raw last close plus valid support and resolved resistance coverage.

## Release rule

Production remains blocked until a fresh protected Atlas Copco A Preview run reaches:

1. Research quality 100/100;
2. Analyst quality 100/100;
3. guarded atomic DEV publication success;
4. manual QA of the published analysis page, chart zones, Bear/Base/Bull, sources and X/OG share card;
5. Founder/ChatGPT release review.

No quality threshold is lowered, no synthetic resistance is invented, no production database write is introduced, and no portfolio history is changed.
