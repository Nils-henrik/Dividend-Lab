import assert from "node:assert/strict";
import { crc32, deflateRawSync } from "node:zlib";
import { describe, it } from "node:test";

import { getPilotCompanies } from "@/lib/companies/catalog";
import { FI_SHORT_INTEREST_COPY, formatShortInterestPercent } from "@/lib/companies/short-interest/copy";
import { fetchFiOds } from "@/lib/companies/short-interest/fetch";
import { FI_COMPANY_IDENTITIES } from "@/lib/companies/short-interest/identity";
import { isIsin, isLei } from "@/lib/companies/short-interest/identifiers";
import { companyShortInterest } from "@/lib/companies/short-interest/match";
import { parseAggregateSheet, parseFiShortInterestOds, parseNamedPositionSheet } from "@/lib/companies/short-interest/parse";
import {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
} from "@/lib/companies/short-interest/constants";

const ERICSSON_LEI = "549300W9JLPW15XIFM52";
const VOLVO_LEI = "549300HGV012CNC8JD22";
const VOLVO_CAR_LEI = "5299000EAMGGBEYP7J33";
const ERICSSON_ISIN = "SE0000108656";
const VOLVO_CAR_ISIN = "SE0021628898";

function aggregateXml(rows: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<office:document-content>
<table:table>
<table:table-row><table:table-cell office:value-type="string"><text:p>Aggregerade positioner</text:p></table:table-cell></table:table-row>
<table:table-row>
<table:table-cell office:value-type="string"><text:p>Namn på emittent<text:s /></text:p><text:p><text:span>(Name of the issuer)</text:span></text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>LEI</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Position i procent<text:s /><text:span>(Position in per cent)</text:span></text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Positionsdatum senaste position</text:p><text:p><text:span>(Position date, latest position)</text:span></text:p></table:table-cell>
</table:table-row>
${rows}
</table:table>
</office:document-content>`;
}

function namedXml(rows: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<office:document-content>
<table:table>
<table:table-row><table:table-cell office:value-type="string"><text:p>Aktuella positioner</text:p></table:table-cell></table:table-row>
<table:table-row>
<table:table-cell office:value-type="string"><text:p>Innehavare av positionen<text:s /></text:p><text:p><text:span>(Position holder)</text:span></text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Namn på emittent<text:s /></text:p><text:p><text:span>(Name of the issuer)</text:span></text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>ISIN</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Position i procent<text:s /><text:span>(Position in per cent)</text:span></text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Datum för positionen<text:s /></text:p><text:p><text:span>(Position date)</text:span></text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>Kommentar<text:s /><text:span>(Comment)</text:span></text:p></table:table-cell>
</table:table-row>
${rows}
</table:table>
</office:document-content>`;
}

function aggregateRow(name: string, lei: string, percent: string, text: string, date: string): string {
  return `<table:table-row>
<table:table-cell office:value-type="string"><text:p> ${name}</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>${lei}</text:p></table:table-cell>
<table:table-cell office:value-type="float" office:value="${percent}"><text:p>${text}</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>${date}</text:p></table:table-cell>
</table:table-row>`;
}

function namedRow(holder: string, issuer: string, isin: string, percent: string, text: string, date: string): string {
  return `<table:table-row>
<table:table-cell office:value-type="string"><text:p>${holder}</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>${issuer}</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>${isin}</text:p></table:table-cell>
<table:table-cell office:value-type="float" office:value="${percent}"><text:p>${text}</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p>${date}</text:p></table:table-cell>
<table:table-cell office:value-type="string"><text:p></text:p></table:table-cell>
</table:table-row>`;
}

function zipEntry(name: string, data: Buffer): Buffer {
  const compressed = deflateRawSync(data);
  const nameBytes = Buffer.from(name);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt32LE(crc32(data) >>> 0, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(nameBytes.length, 26);
  return Buffer.concat([header, nameBytes, compressed]);
}

const SAMPLE_AGGREGATE = aggregateXml([
  aggregateRow("Telefonaktiebolaget LM Ericsson", ERICSSON_LEI, "2.88", "2,88", "2026-09-29"),
  aggregateRow("Aktiebolaget Volvo", VOLVO_LEI, "0.9", "0,9", "2026-09-24"),
  aggregateRow("Volvo Car AB", VOLVO_CAR_LEI, "4.82", "4,82", "2026-09-29"),
  aggregateRow("H &amp; M Hennes &amp; Mauritz AB", "529900O5RR7R39FRDM42", "4.95", "4,95", "2026-09-29"),
].join(""));

const SAMPLE_NAMED = namedXml([
  namedRow("Exempel Fond", "Telefonaktiebolaget LM Ericsson", ERICSSON_ISIN, "0.7", "0,7", "2026-09-29"),
  namedRow("BlackRock Investment Management (UK) Limited", "Volvo Car AB", VOLVO_CAR_ISIN, "0.69", "0,69", "2026-09-15"),
].join(""));

function sampleRegister(fetchedAt: string | null = "2026-09-30T12:00:00.000Z") {
  const register = parseFiShortInterestOds({
    aggregate: zipEntry("content.xml", Buffer.from(SAMPLE_AGGREGATE)),
    currentPositions: zipEntry("content.xml", Buffer.from(SAMPLE_NAMED)),
    fetchedAt,
  });
  assert.ok(register);
  return register;
}

describe("FI blankningsregister", () => {
  it("läser officiella kolumner och skiljer Volvo från Volvo Car", () => {
    const register = sampleRegister();
    const ericsson = companyShortInterest(register, "ericsson");
    assert.equal(ericsson.status, "present");
    assert.equal(ericsson.aggregatePercent, 2.88);
    assert.equal(ericsson.aggregatePercentLabel, "2,88 %");
    assert.equal(ericsson.aggregatePositionDate, "2026-09-29");
    assert.equal(ericsson.lei, ERICSSON_LEI);
    assert.equal(ericsson.namedPositions.length, 1);
    assert.equal(ericsson.namedPositions[0]?.holder, "Exempel Fond");
    assert.equal(ericsson.namedPositions[0]?.percent, 0.7);
    assert.equal(ericsson.message, null);
    assert.equal(ericsson.labels.aggregate, "Summa rapporterad blankning");
    assert.equal(ericsson.labels.significantPositions, "Större publicerade positioner");
    assert.equal(ericsson.labels.source, "Källa: Finansinspektionen");
    assert.equal(ericsson.history.supported, false);
    assert.equal(ericsson.source.publisher, "Finansinspektionen");

    const volvo = companyShortInterest(register, "volvo");
    assert.equal(volvo.status, "present");
    assert.equal(volvo.aggregatePercent, 0.9);
    assert.equal(volvo.issuerName, "Aktiebolaget Volvo");
    assert.deepEqual(volvo.namedPositions, []);
    assert.notEqual(volvo.aggregatePercent, 4.82);

    const hm = companyShortInterest(register, "hm");
    assert.equal(hm.status, "present");
    assert.equal(hm.issuerName, "H & M Hennes & Mauritz AB");
    assert.equal(hm.aggregatePercent, 4.95);
  });

  it("tolkar inte en saknad rad som 0 procent", () => {
    const register = sampleRegister();
    const absent = companyShortInterest(register, "missing-company", {
      lei: "549300VEBQPHRZBKUX38",
      issuerNames: ["Investor Aktiebolag"],
    });
    assert.equal(absent.status, "absent");
    assert.equal(absent.aggregatePercent, null);
    assert.equal(absent.aggregatePercentLabel, null);
    assert.equal(absent.message, "Ingen uppgift i FI:s aktuella blankningsregister.");
    assert.equal(absent.message, FI_SHORT_INTEREST_COPY.absent);
    assert.notEqual(absent.aggregatePercent, 0);

    const fuzzy = companyShortInterest(register, "volvo", {
      lei: VOLVO_LEI,
      issuerNames: ["Volvo"],
    });
    assert.equal(fuzzy.status, "ambiguous");
    assert.equal(fuzzy.aggregatePercent, null);
    assert.notEqual(fuzzy.message, FI_SHORT_INTEREST_COPY.absent);
  });

  it("vägrar tyst namnmatchning och motstridiga identifierare", () => {
    const register = sampleRegister();
    const shortName = companyShortInterest(register, "okand", {
      issuerNames: ["Volvo"],
    });
    assert.equal(shortName.status, "absent");
    assert.equal(shortName.aggregatePercent, null);

    const crossed = companyShortInterest(register, "volvo", {
      lei: VOLVO_LEI,
      isins: [VOLVO_CAR_ISIN],
    });
    assert.equal(crossed.status, "ambiguous");
    assert.equal(crossed.aggregatePercent, null);
    assert.deepEqual(crossed.namedPositions, []);

    const orgOnly = companyShortInterest(register, "okand", {
      organizationNumber: "556013-8298",
    });
    assert.equal(orgOnly.status, "unmatched");
    assert.notEqual(orgOnly.message, FI_SHORT_INTEREST_COPY.absent);

    const unavailable = companyShortInterest(null, "ericsson");
    assert.equal(unavailable.status, "unavailable");
    assert.equal(unavailable.aggregatePercent, null);
    assert.notEqual(unavailable.message, FI_SHORT_INTEREST_COPY.absent);
  });

  it("failar stängt vid schemaavvikelse, nollprocent och dubbletter", () => {
    assert.deepEqual(parseAggregateSheet(aggregateXml("")), []);
    assert.equal(parseAggregateSheet("<office:document-content></office:document-content>"), null);
    const zero = aggregateXml(aggregateRow("Aktiebolaget Volvo", VOLVO_LEI, "0", "0", "2026-09-24"));
    assert.equal(parseAggregateSheet(zero), null);
    const drifted = SAMPLE_AGGREGATE.replace("Position i procent", "Summa blankning");
    assert.equal(parseAggregateSheet(drifted), null);
    const duplicate = aggregateXml([
      aggregateRow("Aktiebolaget Volvo", VOLVO_LEI, "0.9", "0,9", "2026-09-24"),
      aggregateRow("Aktiebolaget Volvo", VOLVO_LEI, "1.1", "1,1", "2026-09-25"),
    ].join(""));
    assert.equal(parseAggregateSheet(duplicate), null);
    const mismatch = aggregateXml(aggregateRow("Aktiebolaget Volvo", VOLVO_LEI, "0.9", "1,9", "2026-09-24"));
    assert.equal(parseAggregateSheet(mismatch), null);
    assert.deepEqual(parseNamedPositionSheet(namedXml("")), []);
    const brokenZip = zipEntry("content.xml", Buffer.from(SAMPLE_AGGREGATE));
    brokenZip[14] = 0;
    assert.equal(parseFiShortInterestOds({
      aggregate: brokenZip,
      currentPositions: zipEntry("content.xml", Buffer.from(SAMPLE_NAMED)),
    }), null);
  });

  it("hämtar bara de två aktuella FI-filerna inom gränsen", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "application/vnd.oasis.opendocument.spreadsheet" },
      });
    }) as typeof fetch;

    const loaded = await fetchFiOds(FI_AGGREGATE_ODS_URL, { fetchImpl, timeoutMs: 1_000, maxBytes: 10 });
    assert.equal(loaded.status, "ok");
    assert.deepEqual(calls, [FI_AGGREGATE_ODS_URL]);

    const historical = await fetchFiOds("https://www.fi.se/BlankningsRegister/GetHistFile", { fetchImpl });
    assert.deepEqual(historical, { status: "error", reason: "invalid_url" });
    const otherOrigin = await fetchFiOds("https://example.com/BlankningsRegister/GetAktuellFile", { fetchImpl });
    assert.equal(otherOrigin.status, "error");
    assert.equal(calls.length, 1);

    const oversized = await fetchFiOds(FI_CURRENT_POSITIONS_ODS_URL, {
      fetchImpl,
      maxBytes: 2,
    });
    assert.deepEqual(oversized, { status: "error", reason: "too_large" });

    const html = (async () => new Response("<html></html>", {
      headers: { "content-type": "text/html" },
    })) as typeof fetch;
    const wrongType = await fetchFiOds(FI_CURRENT_POSITIONS_ODS_URL, { fetchImpl: html });
    assert.deepEqual(wrongType, { status: "error", reason: "unexpected_content_type" });
  });

  it("har unika och giltiga FI-identifierare för katalogbolagen", () => {
    const slugs = new Set(getPilotCompanies().map((company) => company.slug));
    const leis = new Set<string>();
    const names = new Set<string>();
    for (const [slug, identity] of Object.entries(FI_COMPANY_IDENTITIES)) {
      assert.equal(slugs.has(slug), true);
      assert.equal(isLei(identity.lei), true);
      assert.equal(leis.has(identity.lei), false);
      leis.add(identity.lei);
      for (const name of identity.issuerNames) {
        const key = name.toLocaleLowerCase("sv-SE");
        assert.equal(names.has(key), false);
        names.add(key);
      }
      for (const isin of "isins" in identity ? identity.isins : []) {
        assert.equal(isIsin(isin), true);
      }
    }
    assert.deepEqual(FI_COMPANY_IDENTITIES.volvo.issuerNames, ["Aktiebolaget Volvo"]);
    assert.equal(JSON.stringify(FI_COMPANY_IDENTITIES.volvo).includes("Volvo Car"), false);
    assert.equal(JSON.stringify(FI_COMPANY_IDENTITIES.evolution).includes("Evolution Services"), false);
    assert.equal(formatShortInterestPercent(null), null);
    assert.equal(formatShortInterestPercent(0), null);
  });
});
