import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { buildDivLabAnalysisChartModel } from "../lib/analysis/chart-model";
import { analyzeSupportResistance } from "../lib/analysis/support-resistance";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";

function bars(count = 300): DailyBar[] {
  return Array.from({ length: count }, (_, index) => {
    const close = 100 + index * 0.12 + Math.sin(index / 7) * 4;
    return {
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: close - 0.4,
      high: close + 1.2,
      low: close - 1.1,
      close,
      adjustedClose: close,
      volume: 800_000 + (index % 20) * 25_000,
    };
  });
}

function migration(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../supabase/migrations/${name}`, import.meta.url)),
    "utf8",
  );
}

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

describe("DivLab analysis chart publication snapshot", () => {
  it("caps stored chart history and removes future bars from historical analyses", () => {
    const history = bars();
    const asOf = history[279]!.date;
    const levels = analyzeSupportResistance(history);
    const model = buildDivLabAnalysisChartModel({ history, levels, asOf });

    assert.equal(model.version, "analysis-chart-v1");
    assert.equal(model.sessions, 260);
    assert.equal(model.bars.length, 260);
    assert.equal(model.bars.at(-1)!.date, asOf);
    assert.ok(model.bars.every((bar) => bar.date <= asOf));
    assert.equal(model.movingAverages.sma20.length, 241);
    assert.equal(model.movingAverages.sma50.length, 211);
    assert.equal(model.movingAverages.sma200.length, 61);
    assert.equal(model.volume.average20.length, 241);
  });

  it("keeps support/resistance drawings bounded for a readable public chart", () => {
    const history = bars();
    const levels = analyzeSupportResistance(history);
    const model = buildDivLabAnalysisChartModel({ history, levels });

    assert.ok(model.zones.supports.length <= 3);
    assert.ok(model.zones.resistances.length <= 3);
    assert.ok(
      [...model.zones.supports, ...model.zones.resistances].every(
        (zone) => zone.source === "technical_engine" && zone.reasons.length >= 1,
      ),
    );
  });
});

describe("DivLab guarded publication migration", () => {
  it("requires research, analyst, chart and source quality before publication", () => {
    const sql = migration("20260815201109_publish_divlab_analysis_version.sql");

    assert.match(sql, /security invoker/i);
    assert.match(sql, /quality_gate ->> 'score'\)::numeric, -1\) < 100/i);
    assert.match(sql, /analyst_quality_gate_version = 'analyst-quality-v1'/i);
    assert.match(sql, /v_chart ->> 'version'.*analysis-chart-v1/is);
    assert.match(sql, /jsonb_array_length\(v_chart -> 'bars'\) < 30/i);
    assert.match(sql, /primary_source = true/i);
    assert.match(sql, /set published_at = now\(\)/i);
    assert.match(sql, /set status = 'published'/i);
  });

  it("keeps the ordinary publication function service-role-only", () => {
    const sql = migration("20260815201109_publish_divlab_analysis_version.sql");

    assert.match(
      sql,
      /revoke all on function public\.publish_divlab_analysis_version\(uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
    );
    assert.match(
      sql,
      /grant execute on function public\.publish_divlab_analysis_version\(uuid, uuid\)[\s\S]*to service_role;/i,
    );
  });
});

describe("Founder-only Preview publication boundary", () => {
  it("allows only authenticated staff roles to enter the atomic wrapper", () => {
    const sql = migration("20260815212500_founder_publish_divlab_analysis_bundle.sql");

    assert.match(sql, /security definer/i);
    assert.match(sql, /v_user_id := auth\.uid\(\)/i);
    assert.match(sql, /profile_staff_roles/i);
    assert.match(sql, /role in \('founder', 'ceo_divlab', 'admin'\)/i);
    assert.match(sql, /persist_divlab_analysis_bundle/i);
    assert.match(sql, /publish_divlab_analysis_version/i);
    assert.match(
      sql,
      /revoke all on function public\.founder_publish_divlab_analysis_bundle[\s\S]*from public, anon, authenticated;/i,
    );
    assert.match(
      sql,
      /grant execute on function public\.founder_publish_divlab_analysis_bundle[\s\S]*to authenticated;/i,
    );
  });

  it("uses the signed-in Supabase session for publish instead of requiring Preview service-role", () => {
    const route = source("app/api/internal/analysis/run/route.ts");

    assert.match(route, /createAuthenticatedSupabaseClient/);
    assert.match(route, /authSupabase\.auth\.getUser\(\)/);
    assert.match(route, /founderPersistAndPublishDivLabAnalysis/);
    assert.match(route, /const serviceSupabase = persist && !publish/);
    assert.doesNotMatch(route, /publish\) \{[\s\S]{0,400}dev_admin_unavailable/);
  });
});
