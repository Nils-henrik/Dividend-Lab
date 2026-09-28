import {
  parseAddtechOwnership,
  parseAtlasOwnership,
  parseEvolutionOwnership,
  parseHmDividend,
  parseHmOwnership,
  profileFromCeo,
  type ParsedCompanyProfile,
} from "@/lib/companies/ingestion/adapters/official-profile";
import { companyDocumentOrigins } from "@/lib/companies/ingestion/collect";
import {
  fetchOfficialText,
  INGESTION_MAX_HTML_BYTES,
  type SourceFetchContext,
} from "@/lib/companies/ingestion/fetch-source";
import { collectInvestorProfileSource } from "@/lib/companies/ingestion/investor-profile";
import {
  isSupportedCompanyIngestionSlug,
  type SupportedCompanyIngestionSlug,
} from "@/lib/companies/ingestion/queue";

const HTML = ["text/html"] as const;

type ProfileKind = "management" | "ownership" | "dividend";

type ProfileSource = {
  url: string;
  publisher: string;
  parse: (html: string, sourceUrl: string, publisher: string) => ParsedCompanyProfile | null;
};

export const COMPANY_PROFILE_SOURCES: Partial<
  Record<SupportedCompanyIngestionSlug, Partial<Record<ProfileKind, ProfileSource>>>
> = {
  addtech: {
    management: {
      url: "https://www.addtech.com/this-is-addtech/executive-management",
      publisher: "Addtech",
      parse: (html, sourceUrl, publisher) => profileFromCeo(html, sourceUrl, publisher),
    },
    ownership: {
      url: "https://www.addtech.com/investors-and-media/the-share/owners",
      publisher: "Addtech",
      parse: parseAddtechOwnership,
    },
  },
  volvo: {
    management: {
      url: "https://www.volvogroup.com/en/investors/corporate-governance/ceo-and-group-executive-board.html",
      publisher: "Volvo Group",
      parse: (html, sourceUrl, publisher) => profileFromCeo(html, sourceUrl, publisher),
    },
  },
  saab: {
    management: {
      url: "https://www.saab.com/about/company-in-brief/group-management",
      publisher: "Saab",
      parse: (html, sourceUrl, publisher) => profileFromCeo(html, sourceUrl, publisher),
    },
  },
  sandvik: {
    management: {
      url: "https://www.home.sandvik/en/investors/corporate-governance/group-executive-management/",
      publisher: "Sandvik",
      parse: (html, sourceUrl, publisher) => profileFromCeo(html, sourceUrl, publisher),
    },
  },
  hm: {
    management: {
      url: "https://hmgroup.com/about-us/corporate-governance/ceo/",
      publisher: "H&M Group",
      parse: (html, sourceUrl, publisher) => profileFromCeo(html, sourceUrl, publisher),
    },
    ownership: {
      url: "https://hmgroup.com/investors/shareholders/",
      publisher: "H&M Group",
      parse: parseHmOwnership,
    },
    dividend: {
      url: "https://hmgroup.com/investors/dividend/",
      publisher: "H&M Group",
      parse: parseHmDividend,
    },
  },
  evolution: {
    management: {
      url: "https://www.evolution.com/investors/corporate-governance/group-management",
      publisher: "Evolution",
      parse: (html, sourceUrl, publisher) => profileFromCeo(html, sourceUrl, publisher),
    },
    ownership: {
      url: "https://www.evolution.com/investors/share-information/shareholder-structure",
      publisher: "Evolution",
      parse: parseEvolutionOwnership,
    },
  },
  "atlas-copco": {
    management: {
      url: "https://www.atlascopcogroup.com/en/investors/corporate-governance/management-and-remuneration/meet-our-president-and-ceo",
      publisher: "Atlas Copco Group",
      parse: (html, sourceUrl, publisher) => profileFromCeo(html, sourceUrl, publisher),
    },
    ownership: {
      url: "https://www.atlascopcogroup.com/en/investors/atlas-copco-ab-share/shareholders",
      publisher: "Atlas Copco Group",
      parse: parseAtlasOwnership,
    },
  },
  essity: {
    management: {
      url: "https://www.essity.com/company/organization-and-management/executive-management-team/",
      publisher: "Essity",
      parse: (html, sourceUrl, publisher) => profileFromCeo(html, sourceUrl, publisher),
    },
  },
};

function isProfileKind(value: string): value is ProfileKind {
  return value === "management" || value === "ownership" || value === "dividend";
}

export async function collectCompanyProfileSource(
  slug: string,
  sourceType: string,
  sourceUrl: string,
  context: SourceFetchContext,
) {
  if (slug === "investor") {
    return collectInvestorProfileSource(sourceType, sourceUrl, context);
  }
  if (!isSupportedCompanyIngestionSlug(slug) || !isProfileKind(sourceType)) {
    return { status: "error" as const, reason: "source_not_automated" };
  }
  const profile = COMPANY_PROFILE_SOURCES[slug]?.[sourceType];
  if (!profile) {
    return { status: "error" as const, reason: "source_not_automated" };
  }
  if (sourceUrl !== profile.url) {
    return { status: "error" as const, reason: "unexpected_source_url" };
  }
  const origin = new URL(sourceUrl).origin;
  if (!companyDocumentOrigins(slug).includes(origin)) {
    return { status: "error" as const, reason: "unexpected_source_url" };
  }

  const page = await fetchOfficialText(sourceUrl, context, {
    allowedOrigin: origin,
    acceptedContentTypes: HTML,
    maxBytes: INGESTION_MAX_HTML_BYTES,
  });
  if (page.status === "error") {
    return { status: "error" as const, reason: `listing_${page.reason}` };
  }

  const parsed = profile.parse(page.text, sourceUrl, profile.publisher);
  if (!parsed || (parsed.facts.length === 0 && parsed.ownership.length === 0)) {
    return { status: "error" as const, reason: "no_valid_documents" };
  }
  return { status: "ok" as const, facts: parsed.facts, ownership: parsed.ownership };
}
