import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("bolagssidans meny växlar blad utan ankarscroll", () => {
  const content = read("components/companies/CompanyPageContent.tsx");
  const tabs = read("components/companies/CompanyPageTabs.tsx");
  const page = read("app/bolag/[slug]/page.tsx");

  assert.match(content, /<CompanyPageTabs tabs=\{pageTabs\} initialTab=\{initialTab\}>/);
  assert.match(content, /<CompanyTabPanel id="finansiell-utveckling">/);
  assert.match(content, /<CompanyTabPanel id="utdelning">/);
  assert.match(content, /<CompanyTabPanel id="diskussion">/);
  assert.doesNotMatch(content, /href=\{item\.href\}/);

  assert.match(tabs, /role="tablist"/);
  assert.match(tabs, /role="tab"/);
  assert.match(tabs, /type="button"/);
  assert.match(tabs, /window\.history\.pushState/);
  assert.match(tabs, /url\.searchParams\.set\("tab", id\)/);
  assert.match(tabs, /url\.hash = ""/);

  assert.match(page, /searchParams\?: Promise/);
  assert.match(page, /initialTab=\{initialTab\}/);
});
