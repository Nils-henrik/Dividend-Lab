import type { CompanyDataStatus } from "@/lib/companies/official-data";

export type OfficialPanel = "calendar" | "reports" | "press" | "ownership";

const LINK_LABEL: Record<OfficialPanel, string> = {
  calendar: "Se bolagets officiella kalender",
  reports: "Se bolagets officiella rapportarkiv",
  press: "Se bolagets officiella pressmeddelanden",
  ownership: "Se bolagets officiella ägarinformation",
};

const EMPTY_LABEL: Record<OfficialPanel, string> = {
  calendar: "Inga kommande finansiella händelser hittades.",
  reports: "Inga rapporter publicerade.",
  press: "Inga pressmeddelanden publicerade.",
  ownership: "Ingen verifierad ägardata publicerad.",
};

const BLOCKED_LABEL: Record<OfficialPanel, string> = {
  calendar: "Kalendern kan inte läsas automatiskt. Se bolagets officiella kalender",
  reports: "Rapportarkivet kan inte läsas automatiskt. Se bolagets officiella rapportarkiv",
  press: "Pressflödet kan inte läsas automatiskt. Se bolagets officiella pressmeddelanden",
  ownership: "Ägardata kan inte läsas automatiskt. Se bolagets officiella ägarinformation",
};

export function officialPanelCopy(
  panel: OfficialPanel,
  status: CompanyDataStatus,
): { text: string; showLink: boolean } {
  if (status === "available_empty") {
    return { text: EMPTY_LABEL[panel], showLink: false };
  }
  if (status === "blocked") {
    return { text: BLOCKED_LABEL[panel], showLink: true };
  }
  if (status === "temporarily_unavailable") {
    return { text: "Datan kunde inte hämtas just nu.", showLink: false };
  }
  if (status === "schema_unavailable") {
    return { text: "Bolagsdata är inte tillgänglig i den här miljön.", showLink: false };
  }
  return { text: LINK_LABEL[panel], showLink: true };
}

export function officialLeadershipFallback(status: CompanyDataStatus): { text: string; showLink: boolean } {
  if (status === "blocked") {
    return {
      text: "Ledningsuppgiften kan inte läsas automatiskt. Se bolagets officiella ledningsinformation",
      showLink: true,
    };
  }
  if (status === "temporarily_unavailable") {
    return { text: "Datan kunde inte hämtas just nu.", showLink: false };
  }
  if (status === "available_empty" || status === "schema_unavailable") {
    return { text: "Ingen verifierad VD-uppgift.", showLink: false };
  }
  return { text: "Se bolagets officiella ledningsinformation", showLink: true };
}

/** Shown only when no verified per-share amount exists. Never substitutes zero. */
export function officialDividendFallback(status: CompanyDataStatus): string | null {
  if (status === "blocked") {
    return "Utdelningen kan inte läsas automatiskt. Saknat belopp visas inte som noll.";
  }
  if (status === "source_link_only") {
    return "Ingen maskinläst utdelning per aktie. Se den officiella källan.";
  }
  if (status === "temporarily_unavailable") {
    return "Utdelningen kunde inte hämtas just nu.";
  }
  if (status === "available_empty") {
    return "Källan innehöll ingen verifierad utdelning per aktie.";
  }
  return null;
}
