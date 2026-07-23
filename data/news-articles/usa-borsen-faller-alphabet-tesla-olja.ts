import type { NewsArticle } from "@/types/news";

/**
 * Approved Börsnyheter article — do not rewrite body copy.
 * Intraday figures are a 15.54 Swedish-time snapshot on 2026-07-23, not closing prices.
 * Cover: AI-generated illustration (ASCII-safe local copy).
 */
export const USA_BORSEN_FALLER_ALPHABET_TESLA_OLJA_ARTICLE: NewsArticle = {
  id: "usa-borsen-faller-alphabet-tesla-olja",
  slug: "usa-borsen-faller-alphabet-tesla-olja",
  title:
    "USA-börsen faller efter öppningen – Alphabet och Tesla pressar tekniken",
  summary:
    "USA-börsen faller när Alphabet och Tesla rasar efter sina rapporter samtidigt som Brentoljan passerar 100 dollar per fat.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-07-23T18:50:00+02:00",
  url: "/news/usa-borsen-faller-alphabet-tesla-olja",
  featured: true,
  imageUrl: "/news-demo/usa-borsen-faller-efter-oppningen.png",
  thumbnailImageUrl:
    "/news-demo/usa-borsen-faller-efter-oppningen-thumbnail.png",
  imageAlt:
    "Illustration av fallande amerikanska börsindex med symboler för AI-investeringar, elbilar och ett stigande oljepris.",
  imageCaption: "AI-genererad illustration.",
  readingMinutes: 3,
  seoTitle: "USA-börsen faller – Alphabet och Tesla pressar tekniken",
  seoDescription:
    "USA-börsen faller när Alphabet och Tesla rasar efter sina rapporter samtidigt som Brentoljan passerar 100 dollar per fat.",
  seoKeywords: [
    "USA-börsen",
    "Wall Street",
    "Alphabet",
    "Tesla",
    "Nasdaq",
    "S&P 500",
    "Dow Jones",
    "oljepris",
    "Brentolja",
    "AI",
  ],
  showDisclaimer: true,
  intro: [
    "De amerikanska börserna föll tydligt under torsdagens inledande handel. Kraftiga nedgångar i Alphabet och Tesla pressade tekniksektorn, samtidigt som ett oljepris över 100 dollar ökade oron för inflation och högre räntor.",
    "Klockan 15.54 svensk tid hade det breda S&P 500-indexet sjunkit 0,95 procent. Dow Jones var ned 0,97 procent och det tekniktunga Nasdaq Composite hade fallit 1,69 procent.",
    "Nedgången innebar att de stora amerikanska börsindexen nådde sina lägsta nivåer på flera veckor. Marknaden tyngdes både av de senaste bolagsrapporterna och av ett snabbt stigande oljepris.",
  ],
  sections: [
    {
      heading: "Alphabet faller trots stark molntillväxt",
      paragraphs: [
        "Googles moderbolag Alphabet föll omkring 6,4 procent efter sin kvartalsrapport.",
        "Bolagets totala intäkter var högre än analytikerna hade väntat sig och försäljningen inom Google Cloud ökade med 82 procent till 24,8 miljarder dollar. Trots den starka tillväxten riktades investerarnas uppmärksamhet mot kostnaderna för bolagets stora AI-satsning.",
        "Alphabet räknar nu med investeringar på omkring 200 miljarder dollar under året. Pengarna går bland annat till datacenter, servrar och annan infrastruktur som behövs för att utveckla och driva bolagets AI-tjänster.",
        "Samtidigt redovisade Alphabet ett negativt fritt kassaflöde på 5,9 miljarder dollar. Det innebär förenklat att bolaget spenderade mer pengar än verksamheten genererade efter genomförda investeringar.",
        "Marknadens reaktion visar att stark försäljning inte längre alltid är tillräcklig. Investerarna vill även se tydligare bevis på att de mycket stora AI-investeringarna kan ge motsvarande lönsamhet i framtiden.",
      ],
    },
    {
      heading: "Tesla rasar efter negativt kassaflöde",
      paragraphs: [
        "Även Tesla föll kraftigt efter sin rapport. Aktien var ned omkring 12,2 procent under den inledande handeln.",
        "Elbilstillverkaren redovisade ett negativt fritt kassaflöde för första gången på mer än två år. Tesla investerar stora summor i bland annat AI, självkörande teknik, robotaxi och humanoida robotar.",
        "Mycket av värderingen i Tesla bygger på förväntningar om att dessa verksamheter i framtiden ska bli betydligt större än den traditionella bilförsäljningen. När kostnaderna stiger samtidigt som kassaflödet försvagas blir investerarna mer försiktiga kring hur snabbt satsningarna kan börja bidra till resultatet.",
      ],
    },
    {
      heading: "Oljepriset passerar 100 dollar",
      paragraphs: [
        "Rapporterna var inte den enda orsaken till börsnedgången. Brentoljan steg kraftigt och passerade tillfälligt 100 dollar per fat, den högsta nivån sedan slutet av maj.",
        "Bakgrunden är ökade störningar för oljetransporter i Mellanöstern och fortsatta geopolitiska konflikter i regionen.",
        "Ett högre oljepris kan göra transporter, produktion och energi dyrare. Det riskerar i sin tur att hålla inflationen på en högre nivå och göra det svårare för centralbankerna att sänka räntorna.",
        "De amerikanska marknadsräntorna steg efter oljeuppgången. Det pressar särskilt högt värderade teknikbolag, eftersom en större del av deras förväntade vinster ligger långt fram i tiden.",
      ],
    },
    {
      heading: "AI-investeringarna granskas hårdare",
      paragraphs: [
        "Torsdagens handel visar att investerarna har börjat ställa högre krav på de stora teknikbolagens AI-satsningar.",
        "Marknaden har tidigare belönat bolag som investerat aggressivt i artificiell intelligens. Nu växer frågorna kring hur snabbt investeringarna kan omvandlas till högre vinster och starkare kassaflöden.",
        "Alphabet och Tesla är bland de första amerikanska teknikjättarna som rapporterar för kvartalet. Därför kan reaktionerna även påverka hur investerarna bedömer kommande rapporter från andra stora teknikbolag.",
        "De angivna börsrörelserna avser handeln klockan 15.54 svensk tid den 23 juli 2026. Kurserna kan förändras under resten av handelsdagen.",
      ],
    },
  ],
};
