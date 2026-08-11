import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadFreshCandidateBundle } from "./research-store";

function mockSupabase(rows: unknown[]) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    order() {
                      return {
                        limit: async () => ({ data: rows, error: null }),
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("research store cache reuse", () => {
  it("reuses a fresh candidate bundle and ignores expired snapshots", async () => {
    const now = new Date("2026-08-10T09:20:00.000Z");
    const fresh = {
      id: "fresh-1",
      instrument_symbol: "INVE-B",
      exchange: "ST",
      instrument_name: "Investor AB ser. B",
      kind: "market_data",
      publisher: "Yahoo Finance + DivLab deterministic TA",
      source_url: "https://finance.yahoo.com/quote/INVE-B.ST",
      published_at: "2026-08-10T08:00:00.000Z",
      verified_at: "2026-08-10T08:05:00.000Z",
      title: "Investor",
      summary: "Fresh research summary",
      content_hash: "abc",
      metadata: {
        research_kind: "candidate_bundle",
        expires_at: "2026-08-10T11:20:00.000Z",
        primary_source: "yahoo_finance",
        verification_state: "internally_curated",
        fundamentals_source: "yahoo",
        candidate: {
          symbol: "INVE-B",
          exchange: "ST",
          qualityScore: 0.8,
        },
        quote: null,
      },
    };
    const expired = {
      ...fresh,
      id: "expired-1",
      verified_at: "2026-08-10T06:00:00.000Z",
      metadata: {
        ...fresh.metadata,
        expires_at: "2026-08-10T08:00:00.000Z",
      },
    };

    const reused = await loadFreshCandidateBundle({
      supabase: mockSupabase([expired, fresh]) as never,
      symbol: "INVE-B",
      exchange: "ST",
      now,
    });
    assert.equal(reused?.id, "fresh-1");
    assert.equal(reused?.candidate.symbol, "INVE-B");
    assert.equal(reused?.summary, "Fresh research summary");

    const staleOnly = await loadFreshCandidateBundle({
      supabase: mockSupabase([expired]) as never,
      symbol: "INVE-B",
      exchange: "ST",
      now,
    });
    assert.equal(staleOnly, null);
  });
});
