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

export function officialPanelCopy(
  panel: OfficialPanel,
  status: CompanyDataStatus,
): { text: string; showLink: boolean } {
  if (status === "available_empty") {
    return { text: EMPTY_LABEL[panel], showLink: false };
  }
  if (status === "temporarily_unavailable") {
    return { text: "Datan kunde inte hämtas just nu.", showLink: false };
  }
  if (status === "schema_unavailable") {
    return { text: "Bolagsdata är inte tillgänglig i den här miljön.", showLink: false };
  }
  return { text: LINK_LABEL[panel], showLink: true };
}
