import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { Metadata } from "next";
import { PUBLIC_NAV_LINKS } from "@/lib/constants/public-navigation";
import {
  MODEL_PORTFOLIO_INDEXABLE_PATHS,
  MODEL_PORTFOLIO_PROCESS_PATH,
  MODEL_PORTFOLIO_PUBLIC_CATALOG,
  MODEL_PORTFOLIO_PUBLIC_LAUNCH_DATE,
  MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL,
  buildModelPortfolioDetailMetadata,
  buildModelPortfolioHubMetadata,
  buildModelPortfolioProcessMetadata,
} from "@/lib/model-portfolios/public";
import { STATIC_PUBLIC_PATHS } from "@/lib/seo/sitemap-entries";
import { absoluteUrl } from "@/lib/seo/site";

function metadataTitle(title: Metadata["title"]): string {
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "absolute" in title) {
    return String(title.absolute);
  }
  return String(title ?? "");
}

const hubSource = readFileSync(
  new URL("../../app/portfolios/page.tsx", import.meta.url),
  "utf8",
);
const detailSource = readFileSync(
  new URL("../../app/portfolios/[slug]/page.tsx", import.meta.url),
  "utf8",
);
const processSource = readFileSync(
  new URL(
    "../../app/portfolios/sa-fungerar-ai-processen/page.tsx",
    import.meta.url,
  ),
  "utf8",
);
const overviewSource = readFileSync(
  new URL(
    "../../components/portfolios/ModelPortfoliosOverview.tsx",
    import.meta.url,
  ),
  "utf8",
);
const processContentSource = readFileSync(
  new URL(
    "../../components/portfolios/AiProcessPageContent.tsx",
    import.meta.url,
  ),
  "utf8",
);
const privateLayouts = [
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "account",
  "dashboard",
  "settings",
  "messages",
  "contacts",
  "goals",
  "calendar",
  "brain",
  "profile",
  "forum/new",
  "auth",
] as const;

describe("public AI portfolio SEO routes", () => {
  it("keeps hub, process page and four portfolio detail paths in the sitemap registry", () => {
    for (const path of MODEL_PORTFOLIO_INDEXABLE_PATHS) {
      assert.ok(
        STATIC_PUBLIC_PATHS.includes(
          path as (typeof STATIC_PUBLIC_PATHS)[number],
        ),
        `missing ${path} from STATIC_PUBLIC_PATHS`,
      );
    }
  });

  it("exposes a crawlable AI-portföljer link in public navigation", () => {
    assert.ok(
      PUBLIC_NAV_LINKS.some(
        (link) => link.href === "/portfolios" && link.label === "AI-portföljer",
      ),
    );
  });

  it("uses PublicContentShell instead of auth-only AppShell on public portfolio routes", () => {
    assert.match(hubSource, /PublicContentShell/);
    assert.match(detailSource, /PublicContentShell/);
    assert.match(processSource, /PublicContentShell/);
    assert.doesNotMatch(hubSource, /<AppShell/);
    assert.doesNotMatch(detailSource, /<AppShell/);
    assert.doesNotMatch(processSource, /<AppShell/);
  });

  it("declares unique Swedish metadata, self-canonicals and index,follow", () => {
    const hub = buildModelPortfolioHubMetadata();
    const process = buildModelPortfolioProcessMetadata();

    assert.equal(metadataTitle(hub.title), "AI-portföljer för börsen | DivLab");
    assert.match(String(hub.description), /10 augusti 2026/);
    assert.equal(hub.alternates?.canonical, absoluteUrl("/portfolios"));
    assert.deepEqual(hub.robots, { index: true, follow: true });

    assert.equal(
      metadataTitle(process.title),
      "Så arbetar DivLabs AI-portföljer | DivLab",
    );
    assert.equal(
      process.alternates?.canonical,
      absoluteUrl(MODEL_PORTFOLIO_PROCESS_PATH),
    );
    assert.deepEqual(process.robots, { index: true, follow: true });

    for (const entry of MODEL_PORTFOLIO_PUBLIC_CATALOG) {
      const metadata = buildModelPortfolioDetailMetadata(entry.slug);
      assert.ok(metadata);
      assert.equal(metadataTitle(metadata?.title), entry.title);
      assert.equal(
        metadata?.alternates?.canonical,
        absoluteUrl(`/portfolios/${entry.slug}`),
      );
      assert.deepEqual(metadata?.robots, { index: true, follow: true });
      assert.doesNotMatch(metadataTitle(metadata?.title), new RegExp(entry.slug));
    }

    assert.doesNotMatch(hubSource, /index:\s*false/);
    // Unknown slug fallback may be noindex; public catalog metadata must stay indexable.
    assert.match(detailSource, /buildModelPortfolioDetailMetadata/);
    assert.doesNotMatch(processSource, /noindex/i);
  });

  it("canonicalizes detail pages without pagination query strings", () => {
    assert.match(detailSource, /buildModelPortfolioDetailMetadata/);
    for (const entry of MODEL_PORTFOLIO_PUBLIC_CATALOG) {
      const metadata = buildModelPortfolioDetailMetadata(entry.slug);
      assert.equal(
        metadata?.alternates?.canonical,
        `https://divlab.se/portfolios/${entry.slug}`,
      );
      assert.doesNotMatch(String(metadata?.alternates?.canonical), /[?&]page=/);
    }
  });

  it("uses the documented 10 August 2026 launch date as source of truth", () => {
    assert.equal(MODEL_PORTFOLIO_PUBLIC_LAUNCH_DATE, "2026-08-10");
    assert.equal(MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL, "10 augusti 2026");
    assert.match(overviewSource, /MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL/);
    assert.match(overviewSource, /Kan AI slå en traditionell aktieförvaltare\?/);
    assert.match(
      overviewSource,
      /kan AI över tid fatta investeringsbeslut som står sig mot traditionell aktiv aktieförvaltning/,
    );
    assert.doesNotMatch(overviewSource, /tränat upp/i);
  });

  it("links the process CTA to the real public process route", () => {
    assert.match(
      overviewSource,
      /MODEL_PORTFOLIO_PROCESS_PATH|\/portfolios\/sa-fungerar-ai-processen/,
    );
    assert.doesNotMatch(
      overviewSource,
      /Läs mer om processen[\s\S]{0,120}href="#historik"/,
    );
    assert.match(processContentSource, /Data & nyheter/);
    assert.match(processContentSource, /AI-analys/);
    assert.match(processContentSource, /Verifiering/);
    assert.match(processContentSource, /Genomförande/);
    assert.match(processContentSource, /09:20/);
    assert.match(processContentSource, /inte EODHD/);
    assert.match(processContentSource, /8 procent/);
  });
});

describe("private route HTML noindex policy", () => {
  it("declares explicit noindex layouts so private routes do not inherit root index,follow", () => {
    for (const route of privateLayouts) {
      const source = readFileSync(
        new URL(`../../app/${route}/layout.tsx`, import.meta.url),
        "utf8",
      );
      assert.match(source, /noIndexMetadata/, `missing noindex helper in ${route}`);
      assert.doesNotMatch(source, /index:\s*true/);
    }
  });
});
