# DivLab Peer Comparison v1

Status: internal comparison foundation. No automatic peer discovery, no analyst integration and no public UI yet.

## Objective

Peer comparison should add valuation context without allowing an AI model to invent which companies are comparable or turn a lower multiple into an automatic buy signal.

The first version therefore separates two questions:

1. **Which companies are valid peers?** This must be supplied explicitly with traceable relationship evidence.
2. **How do their verified valuation measures compare?** This is deterministic code.

## Contract

`lib/analysis/peer-comparison.ts` accepts:

- one target research snapshot;
- explicit peer research snapshots;
- one or more `relationshipSourceIds` for every peer;
- a set of HTTPS, publisher-labelled, date-verified peer-basis sources.

The comparison engine never discovers peers itself.

It rejects:

- the target company as its own peer;
- duplicate peer identities;
- peers with no relationship source;
- relationship source IDs that are not in the supplied verified basis-source set;
- malformed source URLs or verification dates.

At least three explicit peer members are required for the overall peer set to become `ready`.

## Current comparable valuation measures

v1 compares only dimensionless deterministic valuation measures already produced by Deep Research:

- P/E;
- P/FCF;
- EV/EBIT;
- EV/EBITDA.

A target or peer observation is eligible only when that measure is both available and `traceable=true` in the originating research packet's valuation provenance.

A metric requires at least three eligible peer observations to become `ready`.

For each measure the engine reports:

- target value;
- peer sample size;
- peer median;
- peer minimum;
- peer maximum;
- target difference versus peer median;
- the exact valuation source IDs used by each peer;
- the explicit relationship source IDs supporting peer membership.

## Deliberate non-goals

The engine does **not**:

- assign peers from name similarity, index membership or a model guess;
- assume that companies in the same broad index are operational peers;
- create a composite "cheapness" or "buy" score;
- treat a lower multiple as evidence that a stock is better;
- compare raw EV values across differently sized companies;
- use an untraceable valuation merely because a number exists;
- feed peer results to the analyst yet.

## Integration boundary

The next integration step requires a real peer registry or other explicit peer-selection source with auditable relationship provenance. Only after that exists should Deep Research load peer packets and make `peerComparison` available to the analyst.

The analyst must never be the authority that selects its own comparison group.

## Verification

`tests/divlab-peer-comparison.test.ts` covers:

- ready comparison with three explicit peers;
- deterministic median/min/max and target-vs-median math;
- exclusion of an untraceable peer valuation;
- insufficient status below three peers;
- target-as-peer rejection;
- duplicate peer rejection;
- unknown relationship-source rejection;
- absence of any investment/composite score.
