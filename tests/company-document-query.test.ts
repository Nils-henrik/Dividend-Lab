import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { companyDocumentQueryFailure } from "@/lib/companies/document-query";

describe("company document query errors", () => {
  it("kastar oväntade rapportdatumfel och behåller tomt resultat som tomt", () => {
    assert.equal(companyDocumentQueryFailure(null), "ok");
    assert.equal(
      companyDocumentQueryFailure({ code: "PGRST205", message: "Could not find the table" }),
      "schema_unavailable",
    );
    assert.equal(
      companyDocumentQueryFailure({ message: "relation company_documents does not exist" }),
      "schema_unavailable",
    );
    assert.throws(
      () => companyDocumentQueryFailure({
        code: "57014",
        message: "canceling statement due to statement timeout",
      }),
      /statement timeout/,
    );

    const source = readFileSync(new URL("../lib/companies/server.ts", import.meta.url), "utf8");
    assert.match(source, /companyDocumentQueryFailure\(reportDateResult\.error\)/);
    assert.doesNotMatch(source, /reportDateResult\.error\s*\?/);
  });
});
