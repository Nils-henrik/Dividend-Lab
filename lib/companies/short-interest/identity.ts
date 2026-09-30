import type { CompanyFiMatchIdentity } from "@/lib/companies/types";

/**
 * Explicit issuer identities taken from Finansinspektionen's public register.
 * Runtime matching uses these values exactly and does not search by similarity.
 * Volvo Car is not AB Volvo. Evolution Services is not Evolution AB.
 */
export const FI_COMPANY_IDENTITIES = {
  investor: {
    lei: "549300VEBQPHRZBKUX38",
    issuerNames: ["Investor Aktiebolag"],
  },
  volvo: {
    lei: "549300HGV012CNC8JD22",
    issuerNames: ["Aktiebolaget Volvo"],
  },
  ericsson: {
    lei: "549300W9JLPW15XIFM52",
    issuerNames: ["Telefonaktiebolaget LM Ericsson"],
    isins: ["SE0000108656"],
  },
  "atlas-copco": {
    lei: "213800T8PC8Q4FYJZR07",
    issuerNames: ["Atlas Copco Aktiebolag"],
  },
  astrazeneca: {
    lei: "PY6ZZQWO2IZFZC3IOL08",
    issuerNames: ["ASTRAZENECA PLC"],
  },
  abb: {
    lei: "5493000LKVGOO9PELI61",
    issuerNames: ["ABB Ltd"],
  },
  addtech: {
    lei: "549300QZ5U2IDRHPWL60",
    issuerNames: ["Addtech AB"],
  },
  "alfa-laval": {
    lei: "549300UCKT2UK88AG251",
    issuerNames: ["Alfa Laval AB"],
  },
  "assa-abloy": {
    lei: "549300YECS8HKCIMMB67",
    issuerNames: ["ASSA ABLOY AB"],
  },
  boliden: {
    lei: "21380059QU7IM1ONDJ56",
    issuerNames: ["Boliden AB"],
  },
  epiroc: {
    lei: "5493004Q73OEYW1SPE91",
    issuerNames: ["Epiroc Aktiebolag"],
  },
  eqt: {
    lei: "213800U7P9GOIRKCTB34",
    issuerNames: ["EQT AB"],
  },
  essity: {
    lei: "549300G8E6YUVJ1DA153",
    issuerNames: ["Essity Aktiebolag (publ)"],
    isins: ["SE0009922164"],
  },
  evolution: {
    lei: "549300SUH6ZR1RF6TA88",
    issuerNames: ["Evolution AB (publ)"],
    isins: ["SE0012673267"],
  },
  handelsbanken: {
    lei: "NHBDILHZTYCNBV5UYZ31",
    issuerNames: ["Svenska Handelsbanken AB"],
  },
  hm: {
    lei: "529900O5RR7R39FRDM42",
    issuerNames: ["H & M Hennes & Mauritz AB"],
    isins: ["SE0000106270"],
  },
  hexagon: {
    lei: "549300WJFW6ILNI4TA80",
    issuerNames: ["Hexagon Aktiebolag"],
  },
  industrivarden: {
    lei: "549300TM1DLIQI3B3T37",
    issuerNames: ["Aktiebolaget Industrivärden"],
  },
  lifco: {
    lei: "549300RTLL4VDQRCTW41",
    issuerNames: ["Lifco AB (publ)"],
    isins: ["SE0015949201"],
  },
  nibe: {
    lei: "549300ZQH0FIF1P0MX67",
    issuerNames: ["NIBE Industrier AB"],
    isins: ["SE0015988019"],
  },
  nordea: {
    lei: "529900ODI3047E2LIV03",
    issuerNames: ["Nordea Bank Abp"],
  },
  saab: {
    lei: "549300ZHO4JCQQI13M69",
    issuerNames: ["SAAB Aktiebolag"],
  },
  sandvik: {
    lei: "5299008ZUAXN43LVZF54",
    issuerNames: ["Sandvik Aktiebolag"],
  },
  sca: {
    lei: "549300FW5JDRV1IJ0M67",
    issuerNames: ["Svenska Cellulosa Aktiebolaget SCA"],
    isins: ["SE0000112724", "SE0000171886"],
  },
  seb: {
    lei: "F3JS33DEI6XQ4ZBPTN86",
    issuerNames: ["Skandinaviska Enskilda Banken AB"],
  },
  skanska: {
    lei: "549300UINV5RINHGMG07",
    issuerNames: ["Skanska AB"],
  },
  skf: {
    lei: "549300B6HWYEE57O8J84",
    issuerNames: ["Aktiebolaget SKF"],
    isins: ["SE0000108227"],
  },
  swedbank: {
    lei: "M312WZV08Y7LYUC71685",
    issuerNames: ["Swedbank AB"],
  },
  tele2: {
    lei: "213800EKD193RVI9HL76",
    issuerNames: ["Tele2 AB"],
    isins: ["SE0005190238"],
  },
  telia: {
    lei: "213800FSR9RNDUOTXO25",
    issuerNames: ["Telia Company AB"],
  },
} as const satisfies Record<string, CompanyFiMatchIdentity>;

export type FiCompanySlug = keyof typeof FI_COMPANY_IDENTITIES;

export function fiIdentityForSlug(slug: string): CompanyFiMatchIdentity | null {
  if (!Object.prototype.hasOwnProperty.call(FI_COMPANY_IDENTITIES, slug)) return null;
  return FI_COMPANY_IDENTITIES[slug as FiCompanySlug];
}
