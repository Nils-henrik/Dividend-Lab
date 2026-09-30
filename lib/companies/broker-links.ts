import type { CompanyProfile } from "@/lib/companies/types";

export type BrokerId = "avanza" | "nordnet";

export type BrokerAction = {
  broker: BrokerId;
  href: string;
  label: string;
};

const BROKER_URL: Record<BrokerId, RegExp> = {
  avanza: /^https:\/\/www\.avanza\.se\/aktier\/om-aktien\.html\/\d+\/[a-z0-9-]+$/,
  nordnet: /^https:\/\/www\.nordnet\.se\/aktier\/kurser\/[a-z0-9-]+$/,
};

const LABELS: Record<BrokerId, string> = {
  avanza: "Handla hos Avanza ↗",
  nordnet: "Handla hos Nordnet ↗",
};

/**
 * Accept only a stored canonical instrument URL.
 * Affiliate and tracking parameters are rejected until a verified identifier
 * is substituted into the catalog itself.
 */
export function acceptBrokerUrl(broker: BrokerId, value: string | null | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.username !== ""
    || url.password !== ""
    || url.port !== ""
    || url.search !== ""
    || url.hash !== ""
  ) {
    return null;
  }
  const canonical = url.toString().replace(/\/$/, "");
  return BROKER_URL[broker].test(canonical) ? canonical : null;
}

export function resolveBrokerLinks(
  company: Pick<CompanyProfile, "avanzaUrl" | "nordnetUrl">,
): BrokerAction[] {
  const avanza = acceptBrokerUrl("avanza", company.avanzaUrl);
  const nordnet = acceptBrokerUrl("nordnet", company.nordnetUrl);
  const links: BrokerAction[] = [];
  if (avanza) links.push({ broker: "avanza", href: avanza, label: LABELS.avanza });
  if (nordnet) links.push({ broker: "nordnet", href: nordnet, label: LABELS.nordnet });
  return links;
}
