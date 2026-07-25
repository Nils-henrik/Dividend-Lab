import type { NewsArticle } from "@/types/news";

/**
 * Approved Börsnyheter article — do not rewrite body copy.
 * Locked factual foundation (not rendered as a visible source list):
 * Reuters 2026-07-24 (Wildberries attacks, small-business impact, Bank of Russia);
 * Reuters 2026-07-21 (fuel rerouting/shortages); Bank of Russia 2026-07-24;
 * Council of the EU 21st sanctions package 2026-07-23; Eurostat June 2026.
 *
 * Cover image: Wikimedia Commons archive photograph of a Wildberries warehouse
 * fire on 2024-01-13 (not the July 2026 attacks). Unmodified original JPEG.
 * Source page: https://commons.wikimedia.org/wiki/File:Пожар_на_складе_Wildberries_13.01.24_с_воздуха_02_(cropped).jpg
 * Photographer: Anastasiya Lvova
 * Licence: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
 * Local file: public/news-demo/wildberries-lagerbrand.jpeg
 * Licence metadata: public/news-demo/wildberries-lagerbrand.license.txt
 */
export const UKRAINA_WILDBERRIES_RYSSLAND_BENSIN_INFLATION_ARTICLE: NewsArticle =
  {
    id: "ukraina-wildberries-ryssland-bensin-inflation",
    slug: "ukraina-wildberries-ryssland-bensin-inflation",
    title:
      "Ukraina slår mot Wildberries – bensin och inflation pressar Ryssland",
    summary:
      "Minst åtta Wildberries-lager har attackerats samtidigt som Ryssland kämpar med bränslebrist, dyrare bensin och inflation över centralbankens mål.",
    category: "world-economy",
    source: "DivLab",
    publishedAt: "2026-07-25T00:14:56+02:00",
    url: "/news/ukraina-wildberries-ryssland-bensin-inflation",
    featured: true,
    imageUrl: "/news-demo/wildberries-lagerbrand.jpeg",
    imageWidth: 1800,
    imageHeight: 2401,
    thumbnailImageUrl: "/news-demo/wildberries-lagerbrand.jpeg",
    imageAlt: "Arkivbild från en brand vid ett Wildberries-lager i januari 2024.",
    imageCaption:
      "Arkivbild från en brand vid ett Wildberries-lager den 13 januari 2024. Bilden föreställer inte attackerna i juli 2026. Foto: Anastasiya Lvova/Wikimedia Commons, CC BY-SA 4.0.",
    imageCaptionParts: [
      {
        text: "Arkivbild från en brand vid ett Wildberries-lager den 13 januari 2024. Bilden föreställer inte attackerna i juli 2026. Foto: ",
      },
      {
        text: "Anastasiya Lvova/Wikimedia Commons",
        href: "https://commons.wikimedia.org/wiki/File:Пожар_на_складе_Wildberries_13.01.24_с_воздуха_02_(cropped).jpg",
      },
      { text: ", " },
      {
        text: "CC BY-SA 4.0",
        href: "https://creativecommons.org/licenses/by-sa/4.0/",
      },
      { text: "." },
    ],
    readingMinutes: 6,
    seoTitle: "Ukraina slår mot Wildberries – Ryssland pressas",
    seoDescription:
      "Ukrainska attacker mot Wildberries och ryska raffinaderier pressar logistik, bensinpriser och inflation. Så påverkas Ryssland och Europas säkerhet.",
    seoKeywords: [
      "Ukraina",
      "Ryssland",
      "Europa",
      "Inflation",
      "Energi",
      "Geopolitik",
      "Wildberries",
      "bensin",
      "sanktioner",
    ],
    showDisclaimer: true,
    intro: [
      "Ukrainas långdistansattacker har flyttat sig från enbart militär- och energiinfrastruktur till en av de viktigaste delarna av den ryska vardagsekonomin. Under den senaste veckan har minst åtta lager som tillhör nätjätten Wildberries attackerats.",
      "Samtidigt har återkommande attacker mot ryska oljeraffinaderier bidragit till bränslebrist, köer vid bensinstationer och stigande priser. Den ryska centralbanken räknar nu med högre inflation och betydligt svagare ekonomisk tillväxt än tidigare.",
      "För Europa visar utvecklingen hur kriget, sanktionerna och den ryska hushållsekonomin blir allt mer sammanlänkade.",
    ],
    sections: [
      {
        heading: "Nya attacker mot ”Rysslands Amazon”",
        paragraphs: [
          "Under natten till fredagen den 24 juli träffades ytterligare Wildberries-anläggningar i Sankt Petersburg, Leningradregionen och Simferopol på det av Ryssland annekterade Krim.",
          "Wildberries uppgav att personalen evakuerades och att inga anställda skadades i den senaste attackvågen. Tidigare attacker har däremot fått dödliga konsekvenser. Åtta arbetare dödades när anläggningar i Kotovsk och Elektrostal attackerades den 18 juli.",
          "Sammanlagt har minst åtta Wildberries-lager, motsvarande mer än 10 procent av företagets logistikkapacitet, attackerats sedan den 18 juli.",
          "Ukrainas president Volodymyr Zelenskyj har beskrivit anläggningarna som logistiknav som bland annat används för att förse ryska styrkor med drönarkomponenter och annan utrustning.",
          "Kreml och Wildberries förnekar att företaget hanterar militär materiel. Den militära användningen är därför omstridd och ska inte beskrivas som ett fastställt faktum.",
        ],
      },
      {
        heading: "Därför är Wildberries ett känsligt mål",
        paragraphs: [
          "Wildberries brukar beskrivas som Rysslands motsvarighet till Amazon. Under normala förhållanden kan plattformen hantera mer än 20 miljoner beställningar om dagen.",
          "Tillsammans med konkurrenten Ozon och mindre plattformar hanterar den ryska näthandeln varor och tjänster till ett värde som motsvarar omkring 8,5 procent av landets BNP. Branschen sysselsätter direkt eller indirekt omkring fyra miljoner människor.",
          "Det innebär att attacker mot lagren inte bara påverkar ett stort företag. De slår även mot småföretagare som förvarar nästan hela sina varulager hos Wildberries, kunder som väntar på leveranser och banker som har lånat ut pengar till säljarna.",
          "Flera företagare har uppgett att de förlorat varor värda miljontals rubel och nu har svårt att betala lån, skatter och leverantörer. Wildberries har meddelat att mer än 88 000 säljare har börjat få inledande ersättningar och att berörda låntagare erbjudits tillfälliga betalningsanstånd.",
          "Även om Wildberries lyckas flytta varor till andra lager uppstår extra transporter, förseningar och högre kostnader. Det är sådana störningar som i nästa steg kan bidra till högre priser för konsumenterna.",
        ],
      },
      {
        heading: "Bränslekrisen märks redan i vardagen",
        paragraphs: [
          "Attackvågen mot Wildberries sker samtidigt som Ukraina sedan maj har intensifierat attackerna mot ryska oljeraffinaderier.",
          "Enligt branschuppgifter som Reuters tagit del av motsvarade den ryska bensinproduktionen i början av juli endast omkring 65 procent av den normala säsongsförbrukningen. Följden har blivit lokala bristsituationer och långa köer vid bensinstationer.",
          "Ryssland har försökt skydda Moskvaområdet genom att styra om bränsle från raffinaderier i Sibirien och Ural samt öka leveranserna från Belarus. Landet har även börjat importera drivmedel från Indien.",
          "Tillgången i Moskva hade stabiliserats i mitten av juli, men läget är betydligt svårare i flera andra regioner. På det annekterade Krim har myndigheterna infört bränsleransonering och begränsningar för delar av samhällslivet.",
          "Utvecklingen visar att konsekvenserna inte fördelas jämnt. Huvudstaden prioriteras, medan hushåll och företag längre från Moskva kan möta både brist och högre priser.",
        ],
      },
      {
        heading: "Bensinen har blivit 16 procent dyrare",
        paragraphs: [
          "De ryska bensinpriserna hade enligt officiella uppgifter stigit med omkring 16 procent sedan årsskiftet.",
          "Den årliga inflationen var 6,0 procent i juni, jämfört med 5,3 procent i maj. Den ryska centralbanken räknar nu med att inflationen blir mellan 6 och 7 procent under 2026. Den tidigare prognosen låg på mellan 4,5 och 5,5 procent.",
          "Centralbankens långsiktiga inflationsmål är 4 procent.",
          "Ryssland befinner sig alltså inte i hyperinflation och det finns ännu inget stöd för att beskriva ekonomin som ett omedelbart sammanbrott. Men kombinationen av snabbt stigande bränslepriser, hög ränta och svag tillväxt innebär ett klart hårdare ekonomiskt klimat för vanliga hushåll.",
          "Centralbanken sänkte den 24 juli styrräntan från 14,25 till 14 procent. Det är fortfarande en mycket hög räntenivå som gör bolån, företagslån och investeringar dyra.",
          "Samtidigt sänktes prognosen för den ryska BNP-tillväxten till mellan 0 och 1 procent under året. I det svagaste scenariot växer ekonomin alltså inte alls.",
          "Hushållens inflationsförväntningar steg dessutom i juli till den högsta nivån sedan den kraftiga marknadsoron i mars 2022. När människor och företag räknar med fortsatta prisökningar kan de kräva högre löner eller höja sina egna priser, vilket riskerar att hålla inflationen kvar på en hög nivå.",
        ],
      },
      {
        heading: "Europa pressar samma delar av ekonomin",
        paragraphs: [
          "Ur ett europeiskt perspektiv sker attackerna samtidigt som EU försöker minska Rysslands möjligheter att finansiera och upprätthålla kriget.",
          "Den 23 juli antog EU sitt 21:a sanktionspaket mot Ryssland. Åtgärderna riktas bland annat mot banker, kryptotjänster, oljeraffinaderier, den ryska skuggflottan och företag kopplade till tillverkningen av långdistansdrönare.",
          "EU:s sanktioner och Ukrainas attacker är olika typer av åtgärder, men de skapar press mot flera av samma ekonomiska flaskhalsar: energiintäkter, raffinering, transporter, finansiering och tillgången till teknisk utrustning.",
          "För Europa är målet att minska Rysslands förmåga att finansiera kriget utan att samtidigt orsaka en okontrollerad energichock på världsmarknaden.",
          "EU har minskat sitt direkta beroende av rysk energi kraftigt sedan 2022. Det betyder däremot inte att europeiska konsumenter är helt skyddade. Olja, diesel och bensin handlas på internationella marknader. Om rysk raffinering eller export minskar kraftigt kan även europeiska drivmedelspriser påverkas.",
          "Inflationen i euroområdet var 2,8 procent i juni. Den ryska och europeiska statistiken bygger inte på helt identiska beräkningsmetoder, men skillnaden visar ändå att prispressen för närvarande är betydligt starkare i Ryssland.",
        ],
      },
      {
        heading: "Civila kostnader begränsar den enkla berättelsen",
        paragraphs: [
          "Att attackerna kan skada rysk logistik betyder inte att alla konsekvenser träffar den ryska krigsmakten.",
          "Arbetare har dödats och skadats. Småföretagare har förlorat varulager som finansierats med lån. Kunder kan få vänta på kläder, mediciner, elektronik och andra vardagsvaror.",
          "Det gör Wildberries-attackerna mer omstridda än attacker mot ett tydligt militärt mål eller ett raffinaderi som direkt förser den ryska staten med bränsle och exportintäkter.",
          "Strategin kan öka krigets ekonomiska och politiska kostnad för Kreml. Den kan samtidigt ge ryska myndigheter material till propaganda, skapa fler civila förluster och öka risken för nya ryska vedergällningsattacker.",
          "Ryssland fortsätter samtidigt att angripa ukrainska städer, logistiknav, energisystem och elnät. Den europeiska bedömningen måste därför väga den ryska aggressionens omfattning mot riskerna med att kriget flyttar allt djupare in i civila ekonomiska system.",
        ],
      },
      {
        heading: "Vad händer nu?",
        paragraphs: [
          "Det viktigaste framöver blir om Wildberries snabbt kan återställa sin logistikkapacitet och om Ryssland lyckas få igång de skadade raffinaderierna.",
          "Fortsatt stigande bensinpriser skulle kunna sprida sig vidare till transporter, livsmedel och andra varor. Nya lagerattacker kan samtidigt skapa ytterligare förluster för småföretag och banker.",
          "För Europa blir genomförandet av de nya sanktionerna avgörande. Begränsningar på papperet får mindre effekt om Ryssland kan fortsätta använda mellanhänder, tredjelandsbanker och skuggflottan för att sälja energi och köpa teknik.",
          "Rysslands ekonomi har inte kollapsat. Men kombinationen av störd energiproduktion, skadade logistiksystem, 14 procents styrränta, svag tillväxt och stigande inflationsförväntningar gör det allt svårare för Kreml att upprätthålla bilden av att kriget inte påverkar människors vardag.",
        ],
      },
    ],
  };
