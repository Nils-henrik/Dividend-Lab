# DivLab Master Update — Technical Zone Coverage v1

Date: 2026-08-16
Status: Preview release candidate / fail-closed

## Runtime finding

The fourth real Atlas Copco A Preview run reached:

- Research quality: 91/100
- Analyst quality: 100/100
- Analyst view: neutral
- Risk / confidence: medium / medium
- sole failed Research check: `technicalLevelCoverage`

This proves the qualitative-primary-research expansion closed the previous Analyst quality gap without lowering any Analyst gate. The remaining release blocker is deterministic technical level coverage only.

## Root cause class

The support/resistance engine was too line-like for real market structure in two ways:

1. volatility-near pivots could be split into separate narrow clusters even though a technician would treat them as one price area;
2. `no_validated_resistance_above` used the absolute prior intraday high, so one isolated historical wick could keep resistance unresolved even when no robust resistance zone existed above the current price area.

Neither issue should be solved by lowering `technicalLevelCoverage` or inventing a synthetic level.

## Technical Zone Coverage v1

The deterministic support/resistance engine is hardened as follows:

- raw zone tolerance remains derived from current price and ATR/median daily range;
- pivot clustering now has a bounded overlap envelope of 1.35x the raw tolerance so nearby volatility bands can form one zone;
- merged clusters have a hard maximum spread of 2.4x raw tolerance to prevent chain-merging unrelated levels;
- rendered zone envelopes widen modestly from 0.35x to 0.45x raw tolerance around the cluster center;
- the existing publish filter remains unchanged: a zone still needs at least two pivot reactions or the existing strength score threshold;
- robust wick-based resistance remains represented by validated resistance zones;
- only when no validated resistance zone exists does price-discovery detection compare the current price with the prior closing high instead of allowing a single isolated intraday wick to block the state;
- the public Research quality gate remains unchanged: at least one support zone plus either validated resistance or verified absence of validated resistance above is still mandatory.

## Regression protection

New deterministic tests cover:

- two nearby but previously split resistance pivots becoming one bounded volatility zone with at least two touches;
- an isolated historical wick remaining visible in `priorHigh` while no longer falsely blocking `no_validated_resistance_above` when the closing-price history has been cleared.

## Release rule

Production remains blocked until a fresh real Atlas Copco A protected Preview run reaches:

1. Research quality 100/100;
2. Analyst quality 100/100;
3. guarded atomic DEV publication success;
4. manual QA of the published analysis page, chart zones, Bear/Base/Bull, sources and X/OG share card;
5. Founder/ChatGPT release review.

No quality threshold is lowered, no synthetic resistance is invented, no production database write is introduced, and no portfolio history is changed.
