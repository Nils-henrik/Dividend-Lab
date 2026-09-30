import type { CompanyProfile } from "@/lib/companies/types";

/**
 * Verified instrument URLs and FI identifiers.
 * Avanza orderbook pages were checked against Avanza's market-guide stock
 * payload (name, ISIN, Stockholm listing). Nordnet pages were checked by
 * title containing the exact ticker. FI LEI and issuer name were taken from
 * the aggregate short-interest file for one unambiguous issuer per slug.
 * Nothing here is resolved from a display name at request time.
 */
export const COMPANY_EXTERNAL_IDENTIFIERS: Record<
  string,
  Pick<CompanyProfile, "avanzaUrl" | "nordnetUrl" | "fiLei" | "fiIssuerName">
> = {
  investor: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5247/investor-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/investor-b-inve-b-xsto",
    fiLei: "549300VEBQPHRZBKUX38",
    fiIssuerName: "Investor Aktiebolag",
  },
  volvo: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5269/volvo-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/volvo-b-volv-b-xsto",
    fiLei: "549300HGV012CNC8JD22",
    fiIssuerName: "Aktiebolaget Volvo",
  },
  ericsson: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5240/ericsson-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/ericsson-b-eric-b-xsto",
    fiLei: "549300W9JLPW15XIFM52",
    fiIssuerName: "Telefonaktiebolaget LM Ericsson",
  },
  "atlas-copco": {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5234/atlas-copco-a",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/atlas-copco-a-atco-a-xsto",
    fiLei: "213800T8PC8Q4FYJZR07",
    fiIssuerName: "Atlas Copco Aktiebolag",
  },
  astrazeneca: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5431/astrazeneca",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/astra-zeneca-azn-xsto",
    fiLei: "PY6ZZQWO2IZFZC3IOL08",
    fiIssuerName: "ASTRAZENECA PLC",
  },
  abb: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5447/abb",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/abb-xsto",
    fiLei: "5493000LKVGOO9PELI61",
    fiIssuerName: "ABB Ltd",
  },
  addtech: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5537/addtech-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/addtech-b-addt-b-xsto",
    fiLei: "549300QZ5U2IDRHPWL60",
    fiIssuerName: "Addtech AB",
  },
  "alfa-laval": {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5580/alfa-laval",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/alfa-laval-alfa-xsto",
    fiLei: "549300UCKT2UK88AG251",
    fiIssuerName: "Alfa Laval AB",
  },
  "assa-abloy": {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5271/assa-abloy-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/assa-abloy-b-assa-b-xsto",
    fiLei: "549300YECS8HKCIMMB67",
    fiIssuerName: "ASSA ABLOY AB",
  },
  boliden: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5564/boliden",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/boliden-bol-xsto",
    fiLei: "21380059QU7IM1ONDJ56",
    fiIssuerName: "Boliden AB",
  },
  epiroc: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/861430/epiroc-a",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/epiroc-a-epi-a-xsto",
    fiLei: "5493004Q73OEYW1SPE91",
    fiIssuerName: "Epiroc Aktiebolag",
  },
  eqt: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/1001617/eqt",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/eqt-xsto",
    fiLei: "213800U7P9GOIRKCTB34",
    fiIssuerName: "EQT AB",
  },
  essity: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/764241/essity-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/essity-b-xsto",
    fiLei: "549300G8E6YUVJ1DA153",
    fiIssuerName: "Essity Aktiebolag (publ)",
  },
  evolution: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/549768/evolution",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/evolution-evo-xsto",
    fiLei: "549300SUH6ZR1RF6TA88",
    fiIssuerName: "Evolution AB (publ)",
  },
  handelsbanken: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5264/handelsbanken-a",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/handelsbanken-a-shb-a-xsto",
    fiLei: "NHBDILHZTYCNBV5UYZ31",
    fiIssuerName: "Svenska Handelsbanken AB",
  },
  hm: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5364/h-m-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/hm-b-xsto",
    fiLei: "529900O5RR7R39FRDM42",
    fiIssuerName: "H & M Hennes & Mauritz AB",
  },
  hexagon: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5286/hexagon-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/hexagon-b-hexa-b-xsto",
    fiLei: "549300WJFW6ILNI4TA80",
    fiIssuerName: "Hexagon Aktiebolag",
  },
  industrivarden: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5245/industrivarden-c",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/industrivarden-c-indu-c-xsto",
    fiLei: "549300TM1DLIQI3B3T37",
    fiIssuerName: "Aktiebolaget Industrivärden",
  },
  lifco: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/520898/lifco-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/lifco-b-xsto",
    fiLei: "549300RTLL4VDQRCTW41",
    fiIssuerName: "Lifco AB (publ)",
  },
  nibe: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5325/nibe-industrier-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/nibe-industrier-b-nibe-b-xsto",
    fiLei: "549300ZQH0FIF1P0MX67",
    fiIssuerName: "NIBE Industrier AB",
  },
  nordea: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5249/nordea",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/nordea-nda-se-xsto",
    fiLei: "529900ODI3047E2LIV03",
    fiIssuerName: "Nordea Bank Abp",
  },
  saab: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5401/saab-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/saab-b-xsto",
    fiLei: "549300ZHO4JCQQI13M69",
    fiIssuerName: "SAAB Aktiebolag",
  },
  sandvik: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5471/sandvik",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/sandvik-sand-xsto",
    fiLei: "5299008ZUAXN43LVZF54",
    fiIssuerName: "Sandvik Aktiebolag",
  },
  sca: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5263/sca-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/sca-b-xsto",
    fiLei: "549300FW5JDRV1IJ0M67",
    fiIssuerName: "Svenska Cellulosa Aktiebolaget SCA",
  },
  seb: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5255/seb-a",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/seb-a-xsto",
    fiLei: "F3JS33DEI6XQ4ZBPTN86",
    fiIssuerName: "Skandinaviska Enskilda Banken AB",
  },
  skanska: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5257/skanska-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/skanska-b-ska-b-xsto",
    fiLei: "549300UINV5RINHGMG07",
    fiIssuerName: "Skanska AB",
  },
  skf: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5259/skf-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/skf-b-xsto",
    fiLei: "549300B6HWYEE57O8J84",
    fiIssuerName: "Aktiebolaget SKF",
  },
  swedbank: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5241/swedbank-a",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/swedbank-a-swed-a-xsto",
    fiLei: "M312WZV08Y7LYUC71685",
    fiIssuerName: "Swedbank AB",
  },
  tele2: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5386/tele2-b",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/tele2-b-tel2-b-xsto",
    fiLei: "213800EKD193RVI9HL76",
    fiIssuerName: "Tele2 AB",
  },
  telia: {
    avanzaUrl: "https://www.avanza.se/aktier/om-aktien.html/5479/telia-company",
    nordnetUrl: "https://www.nordnet.se/aktier/kurser/telia-company-telia-xsto",
    fiLei: "213800FSR9RNDUOTXO25",
    fiIssuerName: "Telia Company AB",
  },
};

export function withCompanyIdentifiers(company: CompanyProfile): CompanyProfile {
  const extra = COMPANY_EXTERNAL_IDENTIFIERS[company.slug];
  if (!extra) return company;
  return { ...company, ...extra };
}
