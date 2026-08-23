import type { NewsArticle } from "@/types/news";

/**
 * Evolution technical analysis — 23 August 2026.
 *
 * Editorial angle: a strong positive trend has carried Evolution close to its
 * 52-week high, while RSI above 70 makes the short-term setup more stretched.
 *
 * Verified editorial anchors:
 * - Evolution/EVOG Stockholm close 21 August 2026: 820 SEK, +1.86%, day high
 *   823 SEK, day low 805 SEK, volume about 709k and 52-week high 866 SEK.
 * - Technical cross-check 21 August 2026 after the close: RSI(14) about 74.4,
 *   MACD(12,26) about +8.0, ADX(14) about 43.6, SMA20 about 804.7,
 *   SMA50 about 789.8 and SMA200 about 745.9.
 * - DivLab's internal ta-v1 toolkit uses the same indicator families, including
 *   SMA 20/50/200, EMA 12/26, MACD, RSI14, ADX14, ATR, Bollinger, volume,
 *   breakout, support/resistance and 52-week range.
 *
 * Editor-uploaded asset:
 * - cover: public/news-demo/file_00000000fcdc82439565f9cc07641119.png
 */
export const TEKNISK_ANALYS_EVOLUTION_NIVAER_23_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "teknisk-analys-evolution-nivaer-23-augusti-2026",
  slug: "teknisk-analys-evolution-nivaer-23-augusti-2026",
  title: "Teknisk analys: Evolution nära årshögsta – här är nivåerna att bevaka",
  summary:
    "Evolution stängde fredagen på 820 kronor efter ännu en stark handelsdag. Trendindikatorerna pekar fortsatt uppåt, men RSI över 70 visar att aktien samtidigt är kortsiktigt utsträckt. DivLab går igenom nivåerna som blir viktiga när handeln öppnar igen.",
  category: "company",
  source: "DivLab",
  publishedAt: "2026-08-23T19:05:00+02:00",
  updatedAt: "2026-08-23T21:14:00+02:00",
  url: "/news/teknisk-analys-evolution-nivaer-23-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_00000000fcdc82439565f9cc07641119.png",
  imageAlt:
    "DivLab-omslag för teknisk analys av Evolution med rubriken Evolution, viktiga nivåer att bevaka och datumet 23 augusti 2026.",
  imageCaption:
    "AI-illustration: DivLab. Omslagsbilden är en redaktionell visualisering.",
  readingMinutes: 7,
  seoTitle: "Teknisk analys Evolution: RSI över 70 och viktiga nivåer",
  seoDescription:
    "Evolution stängde på 820 kr. DivLab analyserar RSI, MACD, ADX, glidande medelvärden och nivåerna 805, 823 och 866 kr.",
  seoKeywords: [
    "Evolution",
    "Evolution aktie",
    "teknisk analys Evolution",
    "Evolution RSI",
    "EVOG",
    "EVO",
    "RSI 14",
    "MACD",
    "ADX",
    "glidande medelvärde",
    "stöd och motstånd",
    "teknisk analys",
  ],
  internalLinking: {
    topics: ["teknisk analys", "momentum", "stöd och motstånd", "RSI"],
    companies: ["Evolution"],
    tickers: ["EVO", "EVOG"],
    relatedNewsSlugs: ["miljardbud-pa-evolution"],
    relatedLearningSlugs: ["teknisk-analys-for-nyborjare"],
  },
  showDisclaimer: true,
  intro: [
    "Evolution går in i den nya börsveckan med ett ovanligt tydligt tekniskt läge. Aktien stängde fredagen den 21 augusti på 820 kronor, upp 1,86 procent för dagen, efter att ha handlats mellan 805 och 823 kronor. Därmed återstår bara drygt 5 procent till 52-veckorshögsta på 866 kronor.",
    "Samtidigt har momentum blivit högt. En teknisk kontroll efter fredagens stängning visar RSI(14) omkring 74,4. Det är över den nivå på 70 som ofta beskrivs som överköpt – men i en stark trend är det inte samma sak som att uppgången automatiskt är slut.",
    "DivLabs tekniska analysramverk väger därför inte en enda indikator isolerat. Verktyget kombinerar bland annat trend, momentum, volatilitet, volym, utbrott samt stöd och motstånd. I Evolution pekar flera av de delarna fortfarande åt samma håll: trenden är stark, men marginalen för en kortsiktig rekyl har blivit mindre.",
  ],
  sections: [
    {
      heading: "Trendbilden är fortsatt positiv",
      paragraphs: [
        "Den mest grundläggande observationen är att kursen ligger över de centrala glidande medelvärdena. Vid fredagens stängning låg det enkla 20-dagarsmedelvärdet omkring 804,7 kronor, 50-dagarsmedelvärdet omkring 789,8 kronor och 200-dagarsmedelvärdet omkring 745,9 kronor.",
        "Kursen på 820 kronor ligger alltså över samtliga tre nivåer. Det ger en positiv struktur på både kort, medellång och längre sikt. MA20 ligger dessutom ovanför MA50, som i sin tur ligger ovanför MA200 – en ordning som brukar förknippas med en etablerad stigande trend.",
        "Glidande medelvärden är eftersläpande och säger inte vad som händer nästa handelsdag. Men de hjälper till att sätta den senaste uppgången i ett större sammanhang: Evolution handlas inte bara på en enskild stark dag, utan ovanför flera trendnivåer samtidigt.",
      ],
    },
    {
      heading: "RSI över 70 – en varning, inte en automatisk säljsignal",
      paragraphs: [
        "RSI(14) låg omkring 74,4 efter fredagens handel. En RSI över 70 brukar kallas överköpt eftersom de senaste uppgångsdagarna då har varit ovanligt starka i förhållande till nedgångsdagarna.",
        "Det är däremot viktigt att inte läsa nivån som en mekanisk säljsignal. Starka aktier kan ligga över 70 under längre perioder. Det intressanta blir i stället om kursen fortsätter göra högre toppar samtidigt som RSI börjar göra lägre toppar. En sådan divergens skulle kunna vara ett tecken på att momentum tappar kraft.",
        "För den som vill förstå hur RSI, stöd, motstånd och glidande medelvärden används tillsammans finns DivLabs [guide till teknisk analys](/learning/teknisk-analys-for-nyborjare).",
      ],
    },
    {
      heading: "MACD och ADX bekräftar momentum",
      paragraphs: [
        "Även andra indikatorer stödjer den positiva trendbilden. MACD(12,26) låg omkring +8,0 efter fredagens stängning. Ett positivt MACD-värde visar att det kortare exponentiella medelvärdet ligger över det längre och att den senaste prisutvecklingen har varit starkare än den längre trendtakten.",
        "ADX(14) låg samtidigt omkring 43,6. ADX mäter styrkan i en trend, inte riktningen. Nivåer över ungefär 25 brukar användas som tecken på att en trend är etablerad, medan nivåer över 40 beskriver en betydligt starkare trendmiljö.",
        "Kombinationen av kurs över de längre medelvärdena, positiv MACD och hög ADX ger därför en tydligare trendbild än RSI ensam. Samtidigt gör det höga RSI-värdet att nya uppgångar behöver bedömas tillsammans med prisnivåer och volym, inte bara momentum.",
      ],
    },
    {
      heading: "800–805 kronor blir första stödzonen",
      paragraphs: [
        "Det närmaste området på nedsidan ligger runt 800–805 kronor. Fredagens lägsta kurs var 805 kronor och MA20 låg samtidigt omkring 804,7 kronor. När flera tekniska observationer samlas nära samma pris blir området mer relevant än en enskild exakt krona.",
        "Om en rekyl stannar i den zonen och kursen åter börjar göra högre bottnar skulle den kortare trendstrukturen fortfarande vara intakt. Ett tydligt brott ned genom området skulle däremot flytta fokus mot nästa nivå runt 790 kronor, ungefär där MA50 också befinner sig.",
        "Stöd ska alltid ses som zoner där köpare tidigare kan ha blivit mer aktiva – inte som golv som måste hålla.",
      ],
    },
    {
      heading: "823 kronor är det närmaste motståndet",
      paragraphs: [
        "På ovansidan är 823 kronor den första nivån att hålla ögonen på. Det var fredagens högsta notering och ligger bara tre kronor över stängningskursen. Ett nytt försök över den nivån skulle därför snabbt visa om köparna kan fortsätta driva kursen högre eller om området fortsätter fungera som ett kortsiktigt motstånd.",
        "Ovanför 823 kronor blir 52-veckorshögsta på 866 kronor den tydliga större referenspunkten. Från 820 kronor motsvarar det drygt 5 procents uppgång.",
        "Ett utbrott blir generellt mer intressant om det sker med stigande handelsaktivitet. Fredagens volym var cirka 709 000 aktier, vilket ger en konkret nivå att jämföra med om aktien gör ett nytt försök uppåt.",
      ],
    },
    {
      heading: "Tre tekniska förlopp att följa",
      paragraphs: [
        "Det positiva förloppet är att Evolution etablerar sig över 823 kronor och att rörelsen får stöd av fortsatt stark volym. Då hamnar 866 kronor naturligt närmare i fokus som nästa större historiska nivå.",
        "Ett mer neutralt förlopp är att aktien konsoliderar mellan ungefär 800 och 823 kronor. Det skulle kunna låta RSI falla tillbaka från överköpta nivåer utan att den större stigande trenden behöver brytas.",
        "Det svagare förloppet börjar om 800–805 kronor inte håller. Då blir området runt 790 kronor nästa tekniska referens. Ett sådant brott skulle inte i sig avgöra den långsiktiga utvecklingen, men det skulle visa att den senaste accelerationen har tappat kraft.",
        "Scenarierna är inte prognoser. De beskriver vilka observationer som skulle stärka eller försvaga den tekniska bilden när ny kursdata kommer in.",
      ],
    },
    {
      heading: "DivLabs slutsats",
      paragraphs: [
        "Evolution befinner sig i en stark teknisk trend. Kursen ligger över MA20, MA50 och MA200, medan både MACD och ADX visar fortsatt momentum. Samtidigt ligger RSI över 70, vilket gör aktien mer kortsiktigt utsträckt än tidigare i rörelsen.",
        "Det gör konflikten mellan trend och momentum till det centrala just nu. Så länge 800–805 kronor håller är den korta trendstrukturen fortsatt stark. På ovansidan behöver 823 kronor passeras innan 866 kronor blir den naturliga större nivån att följa.",
        "Teknisk analys bygger på historiska pris- och volymdata. Indikatorvärden kan skilja något mellan datakällor och tidpunkter, och inget av nivåerna ovan innebär en garanti för framtida kursutveckling.",
      ],
    },
  ],
};
