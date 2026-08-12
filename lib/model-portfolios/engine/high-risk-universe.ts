import type { NordicSeedInstrument } from "./nordic-universe";

/**
 * Supplemental Nordic opportunity universe for the high-risk discovery funnel.
 * Runtime Yahoo market-cap/liquidity data decides whether a name remains eligible;
 * these labels are discovery hints, not a permanent statement about index status.
 */
export const NORDIC_SMALL_MID_OPPORTUNITY_SEEDS: readonly NordicSeedInstrument[] = [
  // Sweden
  { symbol: "YUBICO", exchange: "ST", country: "SE", name: "Yubico AB", segment: "mid_cap" },
  { symbol: "LAGR-B", exchange: "ST", country: "SE", name: "Lagercrantz Group AB ser. B", segment: "mid_cap" },
  { symbol: "NCAB", exchange: "ST", country: "SE", name: "NCAB Group AB", segment: "mid_cap" },
  { symbol: "MIPS", exchange: "ST", country: "SE", name: "Mips AB", segment: "mid_cap" },
  { symbol: "BUFAB", exchange: "ST", country: "SE", name: "Bufab AB", segment: "mid_cap" },
  { symbol: "VIT-B", exchange: "ST", country: "SE", name: "Vitec Software Group AB ser. B", segment: "mid_cap" },
  { symbol: "ANOD-B", exchange: "ST", country: "SE", name: "Addnode Group AB ser. B", segment: "mid_cap" },
  { symbol: "OEM-B", exchange: "ST", country: "SE", name: "OEM International AB ser. B", segment: "mid_cap" },

  // Norway
  { symbol: "KIT", exchange: "OL", country: "NO", name: "Kitron ASA", segment: "mid_cap" },
  { symbol: "PROT", exchange: "OL", country: "NO", name: "Protector Forsikring ASA", segment: "mid_cap" },
  { symbol: "BOUV", exchange: "OL", country: "NO", name: "Bouvet ASA", segment: "mid_cap" },
  { symbol: "SCATC", exchange: "OL", country: "NO", name: "Scatec ASA", segment: "mid_cap" },
  { symbol: "BRG", exchange: "OL", country: "NO", name: "Borregaard ASA", segment: "mid_cap" },
  { symbol: "MPCC", exchange: "OL", country: "NO", name: "MPC Container Ships ASA", segment: "mid_cap" },

  // Finland
  { symbol: "HARVIA", exchange: "HE", country: "FI", name: "Harvia Oyj", segment: "mid_cap" },
  { symbol: "QTCOM", exchange: "HE", country: "FI", name: "Qt Group Oyj", segment: "mid_cap" },
  { symbol: "MUSTI", exchange: "HE", country: "FI", name: "Musti Group Oyj", segment: "mid_cap" },
  { symbol: "TOKMAN", exchange: "HE", country: "FI", name: "Tokmanni Group Oyj", segment: "mid_cap" },
  { symbol: "KEMPOWR", exchange: "HE", country: "FI", name: "Kempower Oyj", segment: "mid_cap" },

  // Denmark
  { symbol: "NETC", exchange: "CO", country: "DK", name: "Netcompany Group A/S", segment: "mid_cap" },
  { symbol: "AMBU-B", exchange: "CO", country: "DK", name: "Ambu A/S ser. B", segment: "mid_cap" },
  { symbol: "MATAS", exchange: "CO", country: "DK", name: "Matas A/S", segment: "mid_cap" },
  { symbol: "NTG", exchange: "CO", country: "DK", name: "NTG Nordic Transport Group A/S", segment: "mid_cap" },
] as const;
