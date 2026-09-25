import type { SourceSupportMode } from "@/lib/companies/ingestion/baseline";

export type OfficialCategory = "press" | "reports" | "calendar" | "ceo" | "ownership" | "dividend";

export type OfficialCategoryCoverage = {
  mode: SourceSupportMode;
  href: string;
  blocker: string | null;
};

export type CompanyOfficialCoverage = Record<OfficialCategory, OfficialCategoryCoverage>;

const BLOCKED_BOT = "403 för DivLabBot. Ingen officiell feed verifierades utan att kringgå spärren.";

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
    press: category("automated", "https://www.investorab.com/investors-media/press-releases"),
    reports: category("automated", "https://www.investorab.com/investors-media/reports-presentations/"),
    calendar: category("automated", "https://www.investorab.com/investors-media/events-calendar"),
    ceo: category("automated", "https://www.investorab.com/about-investor/board-management/executive-leadership-team"),
    ownership: category("automated", "https://www.investorab.com/investors-media/the-investor-share/ownership-structure"),
    dividend: category("automated", "https://www.investorab.com/investors-media/the-investor-share/dividend-and-dividend-policy"),
  },
  volvo: documents({
    press: category("automated", "https://www.volvogroup.com/en/news-and-media.html"),
    reports: category("automated", "https://www.volvogroup.com/en/investors/reports-and-presentations.html"),
    calendar: category("automated", "https://www.volvogroup.com/en/investors/financial-calendar.html"),
  }, "https://www.volvogroup.com/"),
  ericsson: documents({
    press: category("automated", "https://www.ericsson.com/en/newsroom/latest-news?locs=68304&typeFilters=3", "Presslistan kan stoppas av bot-skydd. Sidan länkar då till den officiella källan."),
    reports: category("automated", "https://www.ericsson.com/en/investors/financial-reports-and-presentations"),
    calendar: category("automated", "https://www.ericsson.com/en/investors/financial-calendar"),
  }, "https://www.ericsson.com/"),
  "atlas-copco": documents({
    press: category("automated", "https://www.atlascopcogroup.com/en/media/press-releases"),
    reports: category("automated", "https://www.atlascopcogroup.com/en/investors/reports-and-presentations"),
    calendar: category("automated", "https://www.atlascopcogroup.com/en/investors/calendar-and-events"),
  }, "https://www.atlascopcogroup.com/"),
  astrazeneca: documents({
    press: category("automated", "https://www.astrazeneca.com/media-centre/press-releases.html"),
    reports: category("automated", "https://www.astrazeneca.com/investor-relations/results-and-presentations.html"),
    calendar: category("automated", "https://www.astrazeneca.com/investor-relations/events.html"),
  }, "https://www.astrazeneca.com/"),
  saab: documents({
    press: category("automated", "https://www.saab.com/newsroom/press-releases"),
    reports: category("automated", "https://www.saab.com/investors/reports-and-presentations"),
    calendar: category("automated", "https://www.saab.com/investors/calendar"),
  }, "https://www.saab.com/"),
  sandvik: documents({
    press: category("automated", "https://www.home.sandvik/en/investors/press-releases/"),
    reports: category("automated", "https://www.home.sandvik/en/investors/reports-presentations/"),
    calendar: category("automated", "https://www.home.sandvik/en/investors/calendar/"),
  }, "https://www.home.sandvik/"),
  sca: documents({
    press: category("automated", "https://www.sca.com/en/media/press-releases/"),
    reports: category("automated", "https://www.sca.com/en/investors/reports-and-presentations/interim-reports/"),
    calendar: category("automated", "https://www.sca.com/en/investors/ir-calendar/"),
  }, "https://www.sca.com/"),
  addtech: documents({
    press: category("automated", "https://www.addtech.com/investors-and-media/press-releases"),
    reports: category("automated", "https://www.addtech.com/investors-and-media/financial-reports"),
    calendar: category("automated", "https://www.addtech.com/investors-and-media/financial-calendar"),
  }, "https://www.addtech.com/investors-and-media/press-releases"),
  eqt: documents({
    press: category("automated", "https://eqtgroup.com/news"),
    reports: category("automated", "https://eqtgroup.com/shareholders/reports-and-presentations"),
    calendar: category("automated", "https://eqtgroup.com/shareholders/financial-calendar"),
  }, "https://eqtgroup.com/"),
  evolution: documents({
    press: category("automated", "https://www.evolution.com/investors/financial-publications/press-releases"),
    reports: category("automated", "https://www.evolution.com/investors/financial-publications/reports"),
    calendar: category("automated", "https://www.evolution.com/investors/financial-data/financial-calendar"),
  }, "https://www.evolution.com/"),
  nibe: documents({
    press: category("automated", "https://www.nibegroup.com/news"),
    reports: category("automated", "https://www.nibegroup.com/investors"),
    calendar: category("automated", "https://www.nibegroup.com/investors"),
  }, "https://www.nibegroup.com/"),
  essity: documents({
    press: category("automated", "https://www.essity.com/media/press-releases/"),
    reports: category("automated", "https://www.essity.com/investors/financial-reports/interim-reports/"),
    calendar: category("automated", "https://www.essity.com/investors/calendar/"),
  }, "https://www.essity.com/"),
  hm: documents({
    press: category("automated", "https://hmgroup.com/media/news/"),
    reports: category("automated", "https://hmgroup.com/investors/"),
    calendar: category("automated", "https://hmgroup.com/investors/financial-calendar/"),
  }, "https://hmgroup.com/"),
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
  abb: uniform("source_link_only", "https://global.abb/group/en", "Ingen stabil press-, rapport- och kalendertrio i första HTML-svaret."),
  boliden: uniform("blocked", "https://www.boliden.com/investor-relations/", BLOCKED_BOT),
  epiroc: uniform("blocked", "https://www.epirocgroup.com/en/investors", BLOCKED_BOT),
  hexagon: uniform("blocked", "https://hexagon.com/investors", BLOCKED_BOT),
  skanska: uniform("blocked", "https://www.skanska.com/investors/", BLOCKED_BOT),
  industrivarden: documents({
    press: category("source_link_only", "https://www.industrivarden.se/media/Pressmeddelanden/", "MFN-widgeten exponerar ingen verifierad utfärdarspecifik feed."),
    reports: category("source_link_only", "https://www.industrivarden.se/", "Ingen datum satt dokumentlista verifierades."),
    calendar: category("source_link_only", "https://www.industrivarden.se/investerare/Kalender/", "Kalendern kunde inte bindas till en verifierad feed."),
  }, "https://www.industrivarden.se/"),
  lifco: uniform("source_link_only", "https://www.lifco.se/investors/", "Ingen datum satt dokumentlista."),
  nordea: uniform("source_link_only", "https://www.nordea.com/en/investors", "Rapporter saknar dagdatum och kalendern är en skyddad widget."),
  seb: uniform("source_link_only", "https://sebgroup.com/investor-relations", "Sidan exponerar inget verifierat feed-id eller dokumentlista."),
  skf: uniform("source_link_only", "https://www.skf.com/group/investors", "Skal utan dokumentlänkar."),
  swedbank: uniform("source_link_only", "https://www.swedbank.com/investor-relations.html", "Inga rapportlänkar i HTML."),
  tele2: uniform("source_link_only", "https://www.tele2.com/investors", "Skal utan dokumentlänkar."),
  telia: uniform("source_link_only", "https://www.teliacompany.com/en/investors", "Skal utan dokumentlänkar."),
};

export function companyOfficialCoverage(slug: string): CompanyOfficialCoverage | null {
  return COMPANY_OFFICIAL_COVERAGE[slug] ?? null;
}
