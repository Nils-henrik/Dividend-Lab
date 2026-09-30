/**
 * Shared company-page modules. Navigation may still omit a section when the
 * current page has neither data nor a useful source fallback.
 */
export const COMPANY_PAGE_MODULE_IDS = [
  "oversikt",
  "kursutveckling",
  "nyckeltal",
  "finansiell-utveckling",
  "utdelning",
  "rapporter",
  "kalender",
  "agarstruktur",
  "blankning",
  "insyn",
  "nyheter",
  "diskussion",
] as const;

export type CompanyNavItem = {
  id: string;
  label: string;
  href: string;
};

export function companyPageNavigation(input: {
  hasReports: boolean;
  hasOwnership: boolean;
  hasShortInterest: boolean;
  hasInsiders: boolean;
  hasNews: boolean;
  hasCurrentEvents: boolean;
}): CompanyNavItem[] {
  const items: CompanyNavItem[] = [
    { id: "oversikt", label: "Översikt", href: "#oversikt" },
    { id: "kursutveckling", label: "Kurs", href: "#kursutveckling" },
    { id: "nyckeltal", label: "Nyckeltal", href: "#nyckeltal" },
    { id: "finansiell-utveckling", label: "Finansiellt", href: "#finansiell-utveckling" },
    { id: "utdelning", label: "Utdelning", href: "#utdelning" },
  ];
  if (input.hasCurrentEvents) items.push({ id: "aktuellt", label: "Aktuellt", href: "#aktuellt" });
  if (input.hasReports) items.push({ id: "rapporter", label: "Rapporter", href: "#rapporter" });
  if (input.hasOwnership) items.push({ id: "agarstruktur", label: "Ägare", href: "#agarstruktur" });
  if (input.hasShortInterest) items.push({ id: "blankning", label: "Blankning", href: "#blankning" });
  if (input.hasInsiders) items.push({ id: "insyn", label: "Insyn", href: "#insyn" });
  if (input.hasNews) items.push({ id: "nyheter", label: "Nyheter", href: "#nyheter" });
  items.push({ id: "diskussion", label: "Diskussion", href: "#diskussion" });
  return items;
}
