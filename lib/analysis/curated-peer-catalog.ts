import {
  buildPeerRegistryBundleFromMembers,
  type PeerRegistryBundle,
} from "./peer-registry-contract";

export const DIVLAB_CURATED_PEER_CATALOG_VERSION =
  "curated-peer-catalog-v1" as const;

const VERIFIED_AT = "2026-08-15T11:27:00.000Z";

export type CuratedPeerRelationshipKind =
  | "broad_industrial_comparable"
  | "b2b_igaming_ecosystem"
  | "listed_gaming_group";

export type CuratedPeerSet = {
  version: typeof DIVLAB_CURATED_PEER_CATALOG_VERSION;
  relationshipKind: CuratedPeerRelationshipKind;
  rationale: string;
  limitations: string[];
  registry: PeerRegistryBundle;
};

function source(id: string, publisher: string, url: string) {
  return { id, publisher, url, verifiedAt: VERIFIED_AT };
}

const atlasCopco = buildPeerRegistryBundleFromMembers({
  target: { symbol: "ATCO-A", exchange: "ST", name: "Atlas Copco A" },
  dataAsOf: VERIFIED_AT,
  sources: [
    source(
      "peer-source:atlas-copco-2025",
      "Atlas Copco Group",
      "https://www.atlascopcogroup.com/en/investors/reports-and-presentations.html",
    ),
    source(
      "peer-source:munters-2025",
      "Munters Group AB",
      "https://www.munters.com/en-us/news-media/press-releases/2026/munters-annual-and-sustainability-report-2025/",
    ),
    source(
      "peer-source:sandvik-2025",
      "Sandvik AB",
      "https://www.home.sandvik/en/investors/reports-presentations/annual-reports/",
    ),
    source(
      "peer-source:epiroc-2025",
      "Epiroc AB",
      "https://www.epirocgroup.com/en/media/corporate-press-releases/2026/20260319-epiroc-publishes-2025-annual-and-sustainability-report.html",
    ),
  ],
  members: [
    {
      symbol: "MTRS",
      exchange: "ST",
      name: "Munters Group",
      relationshipSourceIds: [
        "peer-source:atlas-copco-2025",
        "peer-source:munters-2025",
      ],
    },
    {
      symbol: "SAND",
      exchange: "ST",
      name: "Sandvik",
      relationshipSourceIds: [
        "peer-source:atlas-copco-2025",
        "peer-source:sandvik-2025",
      ],
    },
    {
      symbol: "EPI-A",
      exchange: "ST",
      name: "Epiroc A",
      relationshipSourceIds: [
        "peer-source:atlas-copco-2025",
        "peer-source:epiroc-2025",
      ],
    },
  ],
});

const evolution = buildPeerRegistryBundleFromMembers({
  target: { symbol: "EVO", exchange: "ST", name: "Evolution" },
  dataAsOf: VERIFIED_AT,
  sources: [
    source(
      "peer-source:evolution-2025",
      "Evolution AB",
      "https://www.evolution.com/investors/financial-publications/reports",
    ),
    source(
      "peer-source:hacksaw-2025",
      "Hacksaw AB",
      "https://www.hacksawgroup.com/en/hacksaw-publishes-annual-report-2025/",
    ),
    source(
      "peer-source:kambi-2025",
      "Kambi Group plc",
      "https://www.kambi.com/annualreport2025/",
    ),
    source(
      "peer-source:gig-software-2025",
      "GiG Software Plc",
      "https://www.gig.com/news/publication-of-2025-annual-report-and-accounts/",
    ),
  ],
  members: [
    {
      symbol: "HACK",
      exchange: "ST",
      name: "Hacksaw",
      relationshipSourceIds: [
        "peer-source:evolution-2025",
        "peer-source:hacksaw-2025",
      ],
    },
    {
      symbol: "KAMBI",
      exchange: "ST",
      name: "Kambi Group",
      relationshipSourceIds: [
        "peer-source:evolution-2025",
        "peer-source:kambi-2025",
      ],
    },
    {
      symbol: "GIG-SDB",
      exchange: "ST",
      name: "GiG Software",
      relationshipSourceIds: [
        "peer-source:evolution-2025",
        "peer-source:gig-software-2025",
      ],
    },
  ],
});

const embracer = buildPeerRegistryBundleFromMembers({
  target: { symbol: "EMBRAC-B", exchange: "ST", name: "Embracer Group B" },
  dataAsOf: VERIFIED_AT,
  sources: [
    source(
      "peer-source:embracer-2025-26",
      "Embracer Group AB",
      "https://www.embracer.com/releases/embracer-group-publishes-annual-report-2025-26/",
    ),
    source(
      "peer-source:paradox-2025",
      "Paradox Interactive AB",
      "https://www.paradoxinteractive.com/investors/financial-reports/paradox-interactive-ab-publishes-annual-report-for-2025",
    ),
    source(
      "peer-source:stillfront-2025",
      "Stillfront Group AB",
      "https://www.stillfront.com/en/stillfront-publishes-annual-report-for-2025/",
    ),
    source(
      "peer-source:mtg-2025",
      "Modern Times Group MTG AB",
      "https://www.mtg.com/press-releases/mtg-publishes-annual-and-sustainability-report-2025/",
    ),
  ],
  members: [
    {
      symbol: "PDX",
      exchange: "ST",
      name: "Paradox Interactive",
      relationshipSourceIds: [
        "peer-source:embracer-2025-26",
        "peer-source:paradox-2025",
      ],
    },
    {
      symbol: "SF",
      exchange: "ST",
      name: "Stillfront Group",
      relationshipSourceIds: [
        "peer-source:embracer-2025-26",
        "peer-source:stillfront-2025",
      ],
    },
    {
      symbol: "MTG-B",
      exchange: "ST",
      name: "Modern Times Group MTG B",
      relationshipSourceIds: [
        "peer-source:embracer-2025-26",
        "peer-source:mtg-2025",
      ],
    },
  ],
});

export const DIVLAB_CURATED_PEER_SETS: readonly CuratedPeerSet[] = [
  {
    version: DIVLAB_CURATED_PEER_CATALOG_VERSION,
    relationshipKind: "broad_industrial_comparable",
    rationale:
      "Nordiska noterade industribolag med överlappande kapitalutrustning, industriell teknik, eftermarknad och/eller luft-, gruv- och infrastrukturexponering. Setet är avsett som bred värderingskontext, inte som en lista över Atlas Copcos namngivna huvudkonkurrenter.",
    limitations: [
      "Atlas Copcos årsredovisning namnger flera direkta konkurrenter som ligger utanför DivLabs nuvarande nordiska primärkälleyta.",
      "Munters, Sandvik och Epiroc har olika slutmarknader och affärsmix; multiplar ska därför tolkas som bred industriell kontext.",
    ],
    registry: atlasCopco,
  },
  {
    version: DIVLAB_CURATED_PEER_CATALOG_VERSION,
    relationshipKind: "b2b_igaming_ecosystem",
    rationale:
      "Nordiska noterade B2B-bolag som säljer spelinnehåll, sportsbook- eller plattformsteknik till iGaming-operatörer. Setet mäter samma operatörsekosystem men inte en identisk produktmix.",
    limitations: [
      "Hacksaw, Kambi och GiG Software är inte tre identiska live-casino-leverantörer.",
      "GiG Software har kort fristående historik efter separationen och kan därför faila peer-research-readiness-v1; motorn ska då blockera setet i stället för att ersätta bolaget automatiskt.",
    ],
    registry: evolution,
  },
  {
    version: DIVLAB_CURATED_PEER_CATALOG_VERSION,
    relationshipKind: "listed_gaming_group",
    rationale:
      "Nordiska noterade spelbolag med egen utveckling, publicering och/eller portföljförvaltning av spel-IP. Setet är avsett som bred börsvärderingskontext för Embracers kvarvarande gaming- och mediaexponering.",
    limitations: [
      "Embracers koncernstruktur har förändrats kraftigt genom avyttringar och avknoppningar, vilket gör historiska multipeljämförelser extra känsliga.",
      "Paradox, Stillfront och MTG skiljer sig tydligt i genre, plattform och intäktsmix; ingen enkel peer-rabatt eller premie får tolkas som köp- eller säljsignal.",
    ],
    registry: embracer,
  },
] as const;

export function getCuratedPeerSet(input: {
  symbol: string;
  exchange: string;
}): CuratedPeerSet | null {
  const symbol = input.symbol.trim().toUpperCase();
  const exchange = input.exchange.trim().toUpperCase();
  return (
    DIVLAB_CURATED_PEER_SETS.find(
      (set) =>
        set.registry.target.symbol === symbol &&
        set.registry.target.exchange === exchange,
    ) ?? null
  );
}
