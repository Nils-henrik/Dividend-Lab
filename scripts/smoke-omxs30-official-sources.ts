import { collectCompanySource, expectedCompanySourceUrl } from "@/lib/companies/ingestion/collect";
import { COMPANY_SOURCE_TYPES } from "@/lib/companies/ingestion/document";
import { SUPPORTED_COMPANY_INGESTION_SLUGS } from "@/lib/companies/ingestion/queue";
import { COMPANY_OFFICIAL_COVERAGE } from "@/lib/companies/official-coverage";

async function main() {
  const now = new Date();
  for (const slug of SUPPORTED_COMPANY_INGESTION_SLUGS) {
    for (const sourceType of COMPANY_SOURCE_TYPES) {
      const sourceUrl = expectedCompanySourceUrl(slug, sourceType);
      const started = Date.now();
      const result = await collectCompanySource(slug, { sourceType, sourceUrl }, {
        now,
        sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
      });
      const elapsed = Date.now() - started;
      if (result.status === "ok") {
        console.log(`${slug}\t${sourceType}\tPASS\t${result.documents.length}\t${elapsed}`);
      } else {
        console.log(`${slug}\t${sourceType}\t${result.reason}\t0\t${elapsed}`);
      }
    }
  }

  for (const [slug, coverage] of Object.entries(COMPANY_OFFICIAL_COVERAGE)) {
    if ((SUPPORTED_COMPANY_INGESTION_SLUGS as readonly string[]).includes(slug)) {
      continue;
    }
    try {
      const response = await fetch(coverage.press.href, {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se)" },
        signal: AbortSignal.timeout(12_000),
      });
      console.log(`${slug}\tpress_probe\t${response.status}\t${coverage.press.mode}\t${coverage.press.blocker ?? ""}`);
    } catch (error) {
      const name = error instanceof Error ? error.name : "error";
      console.log(`${slug}\tpress_probe\tERROR\t${coverage.press.mode}\t${name}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
