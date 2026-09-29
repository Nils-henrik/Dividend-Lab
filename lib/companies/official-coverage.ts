import type { SourceSupportMode } from "@/lib/companies/ingestion/baseline";

export type OfficialCategory = "press" | "reports" | "calendar" | "ceo" | "ownership" | "dividend";

export type OfficialCategoryCoverage = {
  mode: SourceSupportMode;
  href: string;
  blocker: string | null;
};

export type CompanyOfficialCoverage = Record<OfficialCategory, OfficialCategoryCoverage>;

function category(
  mode: SourceSupportMode,
  href: string,
  blocker: string | null = null,
): OfficialCategoryCoverage {
  return { mode, href, blocker };
}

function uniform(
  mode: SourceSupportMode,
  href: string,
  blocker: string | null = null,
): CompanyOfficialCoverage {
  return {
    press: category(mode, href, blocker),
    reports: category(mode, href, blocker),
    calendar: category(mode, href, blocker),
    ceo: category(mode, href, blocker),
    ownership: category(mode, href, blocker),
    dividend: category(mode, href, blocker),
  };
}

function documents(
  input: Record<"press" | "reports" | "calendar", OfficialCategoryCoverage>,
  profileHref: string,
  profileMode: SourceSupportMode = "source_link_only",
): CompanyOfficialCoverage {
  return {
    ...input,
    ceo: category(profileMode, profileHref),
    ownership: category(profileMode, profileHref),
    dividend: category(profileMode, profileHref),
  };
}

export const COMPANY_OFFICIAL_COVERAGE: Record<string, CompanyOfficialCoverage> = {
  investor: {
    press: category("source_link_only", "https://www.investorab.com/investors-media/press-releases", "Presslistan är en AlertIR-embed. Ingen separat utfärdarfeed är tillåten."),
    reports: category("automated", "https://www.investorab.com/investors-media/reports-presentations/"),
    calendar: category("source_link_only", "https://www.investorab.com/investors-media/events-calendar", "Kalendern är en AlertIR-embed. Ingen separat utfärdarfeed är tillåten."),
    ceo: category("automated", "https://www.investorab.com/about-investor/board-management/executive-leadership-team"),
    ownership: category("automated", "https://www.investorab.com/investors-media/the-investor-share/ownership-structure"),
    dividend: category("automated", "https://www.investorab.com/investors-media/the-investor-share/dividend-and-dividend-policy"),
  },
  volvo: {
    press: category("automated", "https://www.volvogroup.com/en/news-and-media.html"),
    reports: category("automated", "https://www.volvogroup.com/en/investors/reports-and-presentations.html"),
    calendar: category("automated", "https://www.volvogroup.com/en/investors/financial-calendar.html"),
    ceo: category("automated", "https://www.volvogroup.com/en/investors/corporate-governance/ceo-and-group-executive-board.html"),
    ownership: category("source_link_only", "https://www.volvogroup.com/en/investors/the-volvo-share.html", "Ägartabellen ligger inte i den officiella HTML-sidan."),
    dividend: category("source_link_only", "https://www.volvogroup.com/en/investors/the-volvo-share.html", "Utdelningen ligger i en AlertIR-embed."),
  },
  ericsson: documents({
    press: category("automated", "https://www.ericsson.com/en/newsroom/latest-news?locs=68304&typeFilters=3", "Presslistan kan stoppas av bot-skydd. Sidan länkar då till den officiella källan."),
    reports: category("automated", "https://www.ericsson.com/en/investors/financial-reports-and-presentations"),
    calendar: category("automated", "https://www.ericsson.com/en/investors/financial-calendar"),
  }, "https://www.ericsson.com/"),
  "atlas-copco": {
    press: category("automated", "https://www.atlascopcogroup.com/en/media-new/press-releases"),
    reports: category("automated", "https://www.atlascopcogroup.com/en/investors/reports-and-presentations"),
    calendar: category("automated", "https://www.atlascopcogroup.com/en/investors/calendar-and-events"),
    ceo: category("automated", "https://www.atlascopcogroup.com/en/investors/corporate-governance/management-and-remuneration/meet-our-president-and-ceo"),
    ownership: category("automated", "https://www.atlascopcogroup.com/en/investors/atlas-copco-ab-share/shareholders"),
    dividend: category("source_link_only", "https://www.atlascopcogroup.com/en/investors", "Ingen utdelning per aktie fanns i den officiella HTML-sidan."),
  },
  astrazeneca: documents({
    press: category("automated", "https://www.astrazeneca.com/media-centre/press-releases.html"),
    reports: category("automated", "https://www.astrazeneca.com/investor-relations/results-and-presentations.html"),
    calendar: category("automated", "https://www.astrazeneca.com/investor-relations/events.html"),
  }, "https://www.astrazeneca.com/"),
  saab: {
    press: category("automated", "https://www.saab.com/newsroom/press-releases"),
    reports: category("automated", "https://www.saab.com/investors/reports-and-presentations"),
    calendar: category("automated", "https://www.saab.com/investors/calendar"),
    ceo: category("automated", "https://www.saab.com/about/company-in-brief/group-management"),
    ownership: category("source_link_only", "https://www.saab.com/investors/the-share/ownership", "Ägardata ligger i en MFN-widget, inte i utfärdarens HTML."),
    dividend: category("source_link_only", "https://www.saab.com/investors/the-share/dividend", "Sidan anger ett styrelseförslag, inte en fastställd utdelning."),
  },
  sandvik: {
    press: category("automated", "https://www.home.sandvik/en/investors/press-releases/"),
    reports: category("automated", "https://www.home.sandvik/en/investors/reports-presentations/"),
    calendar: category("automated", "https://www.home.sandvik/en/investors/calendar/"),
    ceo: category("automated", "https://www.home.sandvik/en/investors/corporate-governance/group-executive-management/"),
    ownership: category("source_link_only", "https://www.home.sandvik/en/investors/share-price-monitor/ownership-structure/", "Ägartabellen finns inte i den officiella HTML-sidan."),
    dividend: category("source_link_only", "https://www.home.sandvik/en/investors/share-price-monitor/dividend-information/", "Utdelning per aktie finns inte i den officiella HTML-sidan."),
  },
  sca: documents({
    press: category("automated", "https://www.sca.com/en/media/press-releases/"),
    reports: category("automated", "https://www.sca.com/en/investors/reports-and-presentations/interim-reports/"),
    calendar: category("automated", "https://www.sca.com/en/investors/ir-calendar/"),
  }, "https://www.sca.com/"),
  addtech: {
    press: category("automated", "https://www.addtech.com/investors-and-media/press-releases"),
    reports: category("automated", "https://www.addtech.com/investors-and-media/financial-reports"),
    calendar: category("automated", "https://www.addtech.com/investors-and-media/financial-calendar"),
    ceo: category("automated", "https://www.addtech.com/this-is-addtech/executive-management"),
    ownership: category("automated", "https://www.addtech.com/investors-and-media/the-share/owners"),
    dividend: category("source_link_only", "https://www.addtech.com/investors-and-media/the-share", "Ingen utdelning per aktie fanns i den officiella HTML-sidan."),
  },
  eqt: documents({
    press: category("automated", "https://eqtgroup.com/news"),
    reports: category("automated", "https://eqtgroup.com/shareholders/reports-and-presentations"),
    calendar: category("automated", "https://eqtgroup.com/shareholders/financial-calendar"),
  }, "https://eqtgroup.com/"),
  evolution: {
    press: category("automated", "https://www.evolution.com/investors/financial-publications/press-releases"),
    reports: category("automated", "https://www.evolution.com/investors/financial-publications/reports"),
    calendar: category("automated", "https://www.evolution.com/investors/financial-data/financial-calendar"),
    ceo: category("automated", "https://www.evolution.com/investors/corporate-governance/group-management"),
    ownership: category("automated", "https://www.evolution.com/investors/share-information/shareholder-structure"),
    dividend: category("source_link_only", "https://www.evolution.com/investors/share-information/the-share", "Ingen utdelning per aktie parserades från den officiella sidan."),
  },
  nibe: documents({
    press: category("automated", "https://www.nibegroup.com/news"),
    reports: category("automated", "https://www.nibegroup.com/investors"),
    calendar: category("automated", "https://www.nibegroup.com/investors"),
  }, "https://www.nibegroup.com/"),
  essity: {
    press: category("automated", "https://www.essity.com/media/press-releases/"),
    reports: category("automated", "https://www.essity.com/investors/financial-reports/interim-reports/"),
    calendar: category("automated", "https://www.essity.com/investors/calendar/"),
    ceo: category("automated", "https://www.essity.com/company/organization-and-management/executive-management-team/"),
    ownership: category("source_link_only", "https://www.essity.com/investors/essity-share/ownership/", "Ägartabellen fanns inte i den officiella HTML-sidan."),
    dividend: category("source_link_only", "https://www.essity.com/investors/essity-share/dividend/", "Utdelning per aktie fanns inte i den officiella HTML-sidan."),
  },
  hm: {
    press: category("automated", "https://hmgroup.com/media/news/"),
    reports: category("automated", "https://hmgroup.com/investors/"),
    calendar: category("automated", "https://hmgroup.com/investors/financial-calendar/"),
    ceo: category("automated", "https://hmgroup.com/about-us/corporate-governance/ceo/"),
    ownership: category("automated", "https://hmgroup.com/investors/shareholders/"),
    dividend: category("automated", "https://hmgroup.com/investors/dividend/"),
  },
  "alfa-laval": documents({
    press: category("automated", "https://www.alfalaval.com/media/newsroom/"),
    reports: category("automated", "https://www.alfalaval.com/media/newsroom/"),
    calendar: category("source_link_only", "https://www.alfalaval.com/investors/", "Ingen datum satt kalender kunde verifieras i nyhetsrummet."),
  }, "https://www.alfalaval.com/investors/"),
  "assa-abloy": documents({
    press: category("automated", "https://www.assaabloy.com/group/en/news-media/press-releases"),
    reports: category("automated", "https://www.assaabloy.com/group/en/investors/reports-presentations/interim-reports"),
    calendar: category("source_link_only", "https://www.assaabloy.com/group/en/investors/events-calendar", "Kalendersidan saknar verifierad datumlista."),
  }, "https://www.assaabloy.com/group/en/investors"),
  handelsbanken: documents({
    press: category("source_link_only", "https://www.handelsbanken.com/en/press-and-news/press-releases", "Pressflödet är inte verifierat som maskinläsbart."),
    reports: category("automated", "https://www.handelsbanken.com/en/investor-relations"),
    calendar: category("automated", "https://www.handelsbanken.com/en/investor-relations"),
  }, "https://www.handelsbanken.com/en/investor-relations"),
  abb: uniform("source_link_only", "https://global.abb/group/en/investors", "Q2 2026 har ett datum i HTML, men dokumentlänken går till stream.swisscom.ch och nedladdningslistan är tom."),
  boliden: uniform("blocked", "https://www.boliden.com/investor-relations/", "www.boliden.com/investor-relations/ omdirigerar till investors.boliden.com, som svarar 403. Sitemap på www.boliden.com listar stories, inte IR-dokument."),
  epiroc: uniform("blocked", "https://www.epirocgroup.com/en/investors", "Cloudflare-challenge (cf-mitigated: challenge) redan på robots.txt. Ingen feed hämtades."),
  hexagon: uniform("blocked", "https://hexagon.com/investors", "Cloudflare-challenge (cf-mitigated: challenge) redan på robots.txt. Ingen feed hämtades."),
  skanska: {
    press: category("source_link_only", "https://www.skanska.com/group/en/media/press-releases", "Presslistan renderas i klienten och visar Loading. Ingen datumlista i första HTML-svaret."),
    reports: category("source_link_only", "https://www.skanska.com/group/en/investors/financial-reports/interim-reports", "PDF-länkar finns, men time-attributet är tomt. Dagdatum gissas inte."),
    calendar: category("source_link_only", "https://www.skanska.com/group/en/investors/financial-reports/calendar", "Kalendern är en Next-payload utan verifierad datumlista i statisk HTML."),
    ceo: category("source_link_only", "https://www.skanska.com/group/en/investors"),
    ownership: category("source_link_only", "https://www.skanska.com/group/en/investors"),
    dividend: category("source_link_only", "https://www.skanska.com/group/en/investors"),
  },
  industrivarden: {
    press: category("automated", "https://www.industrivarden.se/rss/"),
    reports: category("automated", "https://www.industrivarden.se/rss/"),
    calendar: category("automated", "https://www.industrivarden.se/investerare/Kalender/"),
    ceo: category("source_link_only", "https://www.industrivarden.se/", "Ingen VD-rad kunde läsas ur en stabil personmarkup."),
    ownership: category("source_link_only", "https://www.industrivarden.se/", "Ingen ägartabell med ett gemensamt avstämningsdatum verifierades."),
    dividend: category("source_link_only", "https://www.industrivarden.se/", "Ingen beslutad utdelning per aktie verifierades i statisk HTML."),
  },
  lifco: uniform("source_link_only", "https://www.lifco.se/investors/press-releases", "Next-skal utan datumsatta dokument. De enda PDF:erna är integritetspolicy på network.s-z.se."),
  nordea: {
    press: category("automated", "https://www.nordea.com/en/investors"),
    reports: category("automated", "https://www.nordea.com/en/investors"),
    calendar: category("source_link_only", "https://www.nordea.com/en/investors/financial-calendar", "Kalendersidan saknar datumsatta händelser i HTML."),
    ceo: category("source_link_only", "https://www.nordea.com/en/investors", "Ingen generisk VD-markup verifierades på investerarsidan."),
    ownership: category("source_link_only", "https://www.nordea.com/en/investors", "Ingen ägartabell med ett gemensamt avstämningsdatum verifierades."),
    dividend: category("automated", "https://www.nordea.com/en/investors"),
  },
  seb: uniform("source_link_only", "https://sebgroup.com/investor-relations", "IR-, press- och kalendersidor svarar 200 utan datumsatta dokumentlänkar eller feed-id."),
  skf: uniform("source_link_only", "https://www.skf.com/group/investors", "IR-sidan är ett skal utan dokumentlänkar."),
  swedbank: {
    press: category("automated", "https://www.swedbank.com/investor-relations.html"),
    reports: category("automated", "https://www.swedbank.com/investor-relations.html"),
    calendar: category("source_link_only", "https://www.swedbank.com/investor-relations/financial-calendar.html", "Kalendersidan saknar datumsatta händelser. Rapportfiler på internetbank.swedbank.se har query-sträng och används inte."),
    ceo: category("source_link_only", "https://www.swedbank.com/investor-relations.html", "Ingen generisk VD-markup verifierades."),
    ownership: category("source_link_only", "https://www.swedbank.com/investor-relations.html", "Ingen ägartabell med ett gemensamt avstämningsdatum verifierades."),
    dividend: category("source_link_only", "https://www.swedbank.com/investor-relations.html", "Ingen beslutad utdelning per aktie verifierades i IR-sidans HTML."),
  },
  tele2: {
    press: category("automated", "https://www.tele2.com/investors/"),
    reports: category("automated", "https://www.tele2.com/investors/"),
    calendar: category("automated", "https://www.tele2.com/investors/"),
    ceo: category("automated", "https://www.tele2.com/investors/"),
    ownership: category("source_link_only", "https://www.tele2.com/investors/", "Ingen ägartabell med ett gemensamt avstämningsdatum verifierades."),
    dividend: category("source_link_only", "https://www.tele2.com/investors/", "Ingen beslutad utdelning per aktie verifierades på investerarsidan."),
  },
  telia: uniform("source_link_only", "https://www.teliacompany.com/en/investors", "IR-sidan är ett kort skal utan dokumentlista."),
};

export function companyOfficialCoverage(slug: string): CompanyOfficialCoverage | null {
  return COMPANY_OFFICIAL_COVERAGE[slug] ?? null;
}
