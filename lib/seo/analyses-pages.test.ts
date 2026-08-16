import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { INDEXABLE_STATIC_PUBLIC_PATHS } from "./public-routes";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

describe("DivLab Analys public SEO contract", () => {
  it("keeps the analysis library in the canonical static public route registry", () => {
    assert.ok(INDEXABLE_STATIC_PUBLIC_PATHS.includes("/analyses"));
  });

  it("keeps the detail route indexable with canonical, article metadata and X card", () => {
    const page = source("app/analyses/[slug]/page.tsx");

    assert.match(page, /getPublishedDivLabAnalysis\(slug\)/);
    assert.match(page, /robots:\s*\{\s*index:\s*true,\s*follow:\s*true\s*\}/);
    assert.match(page, /alternates:\s*\{\s*canonical\s*\}/);
    assert.match(page, /type:\s*"article"/);
    assert.match(page, /twitter:\s*\{[\s\S]*card:\s*"summary_large_image"/);
    assert.match(page, /\/analyses\/\$\{analysis\.slug\}\/opengraph-image/);
    assert.match(page, /"@type":\s*"Article"/);
    assert.match(page, /breadcrumbJsonLd/);
    assert.match(page, /AnalysisShareActions/);
  });

  it("fails closed unless storage says published and current research/content contracts revalidate", () => {
    const reader = source("lib/analysis/public-read.ts");

    assert.match(reader, /createDivLabAnalysisReadClient/);
    assert.match(reader, /\.eq\("status",\s*"published"\)/);
    assert.match(reader, /\.eq\("publishable",\s*true\)/);
    assert.match(reader, /\.not\("published_at",\s*"is",\s*null\)/);
    assert.match(reader, /buildVersionedResearchPacketFromRow/);
    assert.match(reader, /packet\.chart\.version !== "analysis-chart-v1"/);
    assert.match(reader, /divLabAnalystDraftSchema\.parse/);
    assert.match(reader, /evaluateAnalystContentQuality/);
    assert.match(reader, /if \(!analystQualityGate\.publishable\) return null/);
  });

  it("uses the explicit DEV analysis database for Preview reads without generic fallback", () => {
    const client = source("lib/analysis/read-client.ts");

    assert.match(client, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) === "preview"/);
    assert.match(client, /return createDivLabAnalysisDevAdminClient\(\)/);
    assert.match(client, /return createModelPortfolioAdminClient\(\)/);
  });

  it("keeps the X/Open Graph image large and grounded in the frozen chart", () => {
    const image = source("app/analyses/[slug]/opengraph-image.tsx");

    assert.match(image, /width:\s*1200/);
    assert.match(image, /height:\s*630/);
    assert.match(image, /getPublishedDivLabAnalysis\(slug\)/);
    assert.match(image, /packet\.chart\.bars/);
    assert.match(image, /packet\.chart\.zones\.supports/);
    assert.match(image, /packet\.chart\.zones\.resistances/);
    assert.match(image, /AI-MARKERADE PRISOMRÅDEN/);
  });

  it("keeps direct X sharing and link copying on published analyses", () => {
    const share = source("components/analysis/AnalysisShareActions.tsx");

    assert.match(share, /https:\/\/x\.com\/intent\/post/);
    assert.match(share, /navigator\.clipboard\.writeText/);
    assert.match(share, /Dela på X/);
    assert.match(share, /Kopiera länk/);
  });

  it("keeps the analysis library page canonical and indexable", () => {
    const page = source("app/analyses/page.tsx");

    assert.match(page, /canonical:\s*getCanonicalUrl\("\/analyses"\)/);
    assert.match(page, /robots:\s*\{\s*index:\s*true,\s*follow:\s*true\s*\}/);
    assert.match(page, /listPublishedDivLabAnalyses\(24\)/);
    assert.match(page, /Fundamental analys/);
    assert.match(page, /Teknisk analys/);
    assert.match(page, /Stöd & motstånd/);
  });

  it("keeps the operator testcenter preview-only, noindex and long enough for real research", () => {
    const page = source("app/analyses/internal-preview/page.tsx");
    const operator = source("components/analysis/AnalysisPreviewOperator.tsx");
    const route = source("app/api/internal/analysis/run/route.ts");

    assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/);
    assert.match(page, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/);
    assert.match(page, /notFound\(\)/);
    assert.match(operator, /method:\s*"POST"/);
    assert.match(operator, /persist:\s*true/);
    assert.match(operator, /publish:\s*true/);
    assert.match(operator, /\/api\/internal\/analysis\/run/);
    assert.match(route, /export const maxDuration = 300/);
  });
});
