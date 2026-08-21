import type { LearningArticle } from "../types";

const article: LearningArticle = {
  slug: "sa-laser-du-en-kvartalsrapport",
  title: "Så läser du en kvartalsrapport – steg för steg",
  seoTitle: "Så läser du en kvartalsrapport – guide med exempel",
  description:
    "Lär dig läsa en kvartalsrapport steg för steg. DivLab förklarar omsättning, marginaler, EBIT, kassaflöde och balansräkning med Ericsson som exempel.",
  excerpt:
    "Vad ska man egentligen titta på när ett bolag rapporterar? Här går vi igenom kvartalsrapporten steg för steg med Ericssons Q2 2025 som verkligt exempel.",
  category: "Aktier & analys",
  level: "Nybörjare",
  publishedAt: "2026-08-21",
  updatedAt: "2026-08-21",
  authorName: "DivLab Redaktion",
  coverImage: "/learning/file_000000000c1881f4b02d44aaab686ddb.png",
  coverImageAlt:
    "Solsäng och stängd laptop vid en pool i medelhavsmiljö med rubriken Så läser du en kvartalsrapport.",
  thumbnailObjectPosition: "left center",
  relatedArticleSlugs: [
    "borsens-ordlista",
    "pe-tal-vad-betyder-det",
    "vad-ar-en-aktie",
    "borja-investera-pa-borsen",
  ],
  showDefaultDisclaimer: true,
  intro: [
    "Ett börsbolag publicerar normalt en rapport fyra gånger om året. Där får aktieägarna veta hur verksamheten har utvecklats, hur mycket bolaget har sålt, hur lönsamheten förändrats, hur mycket pengar verksamheten genererat och hur ledningen ser på framtiden.",
    "Problemet är att en kvartalsrapport snabbt kan kännas överväldigande. Omsättning, organisk tillväxt, EBIT, EBITA, EBITDA, rörelsemarginal, kassaflöde, engångsposter och resultat per aktie kan dyka upp på samma sida.",
    "Du behöver däremot inte förstå varje rad för att få en bra bild av företaget. I den här guiden går vi igenom rapporten steg för steg och använder Ericssons rapport för andra kvartalet 2025 som ett historiskt, verkligt exempel.",
  ],
  sections: [
    {
      heading: "Börja med helheten",
      paragraphs: [
        "När en rapport släpps är det lätt att direkt leta efter om vinsten ökade eller minskade. Försök i stället först förstå helheten.",
        "En bra första genomgång handlar om att besvara några få frågor. Växer bolaget? Blir verksamheten mer eller mindre lönsam? Genererar den pengar? Hur ser skuldsättningen ut? Finns det engångsposter? Och vad säger ledningen om framtiden?",
      ],
      numberedItems: [
        "Växer försäljningen?",
        "Förbättras eller försämras marginalerna?",
        "Hur utvecklas rörelseresultatet?",
        "Genererar verksamheten ett starkt kassaflöde?",
        "Har nettoskulden eller nettokassan förändrats?",
        "Finns stora engångsposter eller justeringar?",
        "Hur ser ledningen på kommande kvartal?",
        "Hur står sig utfallet mot marknadens förväntningar?",
      ],
    },
    {
      heading: "1. Omsättning – hur mycket säljer företaget?",
      paragraphs: [
        "Omsättningen, som också kan kallas försäljning eller nettoomsättning, visar hur mycket företaget har sålt för under perioden. Det är ofta en av de första siffrorna i rapporten.",
        "Om ett företag omsatte 10 miljarder kronor samma kvartal förra året och 11 miljarder i år har den rapporterade omsättningen ökat med 10 procent. Men omsättningen kan påverkas av mer än själva verksamheten. Valutakurser, förvärv och försäljningar av verksamheter kan göra stor skillnad.",
      ],
      subsections: [
        {
          subheading: "Ericsson Q2 2025 – omsättningen föll samtidigt som den organiska försäljningen ökade",
          paragraphs: [
            "Ericsson rapporterade en nettoomsättning på 56,1 miljarder kronor, jämfört med 59,8 miljarder samma kvartal året innan. Den rapporterade försäljningen föll alltså med 6 procent.",
            "Samtidigt ökade den organiska försäljningen med 2 procent. Ericsson uppgav att valutakurser påverkade den rapporterade försäljningen negativt med 4,7 miljarder kronor.",
            "Det betyder att två till synes motsägelsefulla saker kunde vara sanna samtidigt: den rapporterade omsättningen föll, medan den underliggande försäljningen växte.",
          ],
        },
        {
          subheading: "Vad är organisk tillväxt?",
          paragraphs: [
            "Organisk tillväxt försöker visa hur den befintliga verksamheten utvecklas när effekter från exempelvis valuta, förvärv och avyttringar räknas bort.",
            "Tänk dig ett svenskt företag som säljer mycket i USA. Om dollarn försvagas mot kronan kan den amerikanska försäljningen bli värd färre kronor när den räknas om, även om företaget säljer fler produkter. Därför bör du kontrollera både den rapporterade och den organiska utvecklingen.",
          ],
        },
      ],
      relatedLinks: [
        {
          slug: "borsens-ordlista",
          text: "Slå upp fler rapportbegrepp i DivLabs Börsordlista",
        },
      ],
    },
    {
      heading: "2. Bruttoresultat och bruttomarginal – vad blir kvar efter de direkta kostnaderna?",
      paragraphs: [
        "När företaget har sålt sina produkter eller tjänster kostar det pengar att producera och leverera dem. Bruttoresultatet visar förenklat hur mycket som finns kvar efter de direkta kostnaderna för det som sålts.",
        "Bruttomarginalen visar samma relation i procent. Om ett bolag säljer för 100 kronor och de direkta kostnaderna är 60 kronor blir bruttoresultatet 40 kronor och bruttomarginalen 40 procent.",
        "En stigande bruttomarginal kan exempelvis bero på högre priser, lägre produktionskostnader eller att bolaget säljer en mer lönsam mix av produkter och tjänster.",
      ],
      subsections: [
        {
          subheading: "Ericsson Q2 2025",
          paragraphs: [
            "Ericssons justerade bruttoresultat ökade till 27,0 miljarder kronor från 26,3 miljarder. Den justerade bruttomarginalen steg samtidigt från 43,9 till 48,0 procent.",
            "Det är intressant eftersom den rapporterade omsättningen samtidigt hade minskat. Bolaget behöll alltså en större andel av varje försäljningskrona som bruttoresultat. Det visar varför marginalerna ibland berättar mer än omsättningen ensam.",
          ],
        },
      ],
    },
    {
      heading: "3. EBIT, EBITA och EBITDA – tre resultatmått du ofta möter",
      paragraphs: [
        "Efter bruttoresultatet kommer fler kostnader, exempelvis för personal, forskning, försäljning och administration. När de räknats bort kommer flera vanliga resultatmått in i bilden.",
      ],
      bullets: [
        "EBIT står för Earnings Before Interest and Taxes och motsvarar i praktiken rörelseresultatet före räntor och skatt.",
        "EBITA är resultat före räntor, skatt och vissa avskrivningar på immateriella tillgångar.",
        "EBITDA är resultat före räntor, skatt samt av- och nedskrivningar.",
      ],
      paragraphsAfterLists: [
        "Det viktigaste som nybörjare är inte att memorera alla engelska förkortningar. Det viktiga är att förstå att måtten inte är samma sak. När du jämför bolag bör du försöka jämföra samma typ av resultatmått.",
        "Ericsson redovisade i Q2 2025 ett rapporterat EBIT på cirka 6,4 miljarder kronor. Justerat EBIT var cirka 7,0 miljarder, medan justerad EBITA uppgick till 7,4 miljarder kronor.",
      ],
      relatedLinks: [
        {
          slug: "borsens-ordlista",
          text: "Läs definitionerna av EBIT, EBITA och EBITDA i Börsens ordlista",
        },
      ],
    },
    {
      heading: "4. Marginalen visar hur lönsam verksamheten är",
      paragraphs: [
        "Ett resultat på en miljard kronor låter stort, men siffran betyder olika saker beroende på hur stort företaget är. Därför använder investerare marginaler.",
        "Förenklat visar rörelsemarginalen hur stor del av försäljningen som blir rörelseresultat. Om ett bolag säljer för 100 kronor och har 10 kronor i rörelseresultat är rörelsemarginalen 10 procent.",
        "Ericssons justerade EBITA-marginal steg från 6,8 procent i Q2 2024 till 13,2 procent i Q2 2025. Det visar att bolaget genererade betydligt mer resultat i förhållande till sin försäljning.",
      ],
      callout:
        "När du läser en rapport: fråga inte bara hur många miljarder bolaget tjänade. Fråga också hur stor del av försäljningen som blev resultat.",
    },
    {
      heading: "5. Rapporterat eller justerat resultat?",
      paragraphs: [
        "Företag presenterar ofta både rapporterade och justerade siffror. De justerade måtten räknar bort vissa kostnader eller intäkter som bolaget anser inte speglar den löpande verksamheten.",
      ],
      bullets: [
        "omstruktureringskostnader",
        "nedskrivningar",
        "kostnader kopplade till förvärv",
        "större engångsvinster eller engångsförluster",
      ],
      paragraphsAfterLists: [
        "Justerade siffror kan vara användbara, men de ska inte accepteras okritiskt. Kostnaden har trots allt ofta funnits på riktigt.",
        "I Ericssons Q2 2025 var rapporterad EBITA cirka 6,8 miljarder kronor medan justerad EBITA var cirka 7,4 miljarder. Ericsson anger att de justerade måtten exkluderar omstruktureringskostnader.",
        "En bra kontrollfråga är därför: Vad har justerats bort, och är det verkligen ovanligt eller återkommer liknande poster nästan varje år?",
      ],
    },
    {
      heading: "6. Resultat efter skatt och vinst per aktie",
      paragraphs: [
        "Efter rörelseresultatet påverkas resultatet bland annat av räntor och skatt. Till slut kommer vi till periodens resultat, eller nettoresultatet.",
        "Ericsson redovisade ett resultat på cirka 4,6 miljarder kronor i Q2 2025, jämfört med cirka minus 11,0 miljarder året innan. Vid första anblick ser det ut som en enorm förbättring.",
        "Men jämförelseperioden 2024 belastades av en nedskrivningskostnad på 11,4 miljarder kronor. Det är ett tydligt exempel på varför du måste förstå vad som ligger bakom förändringen och inte bara läsa den stora procentsiffran.",
        "Vinst per aktie, ofta förkortat EPS, visar hur stor del av vinsten som motsvarar varje aktie. Ericssons utspädda resultat per aktie var 1,37 kronor i Q2 2025, jämfört med minus 3,34 kronor samma kvartal året innan.",
      ],
      relatedLinks: [
        {
          slug: "pe-tal-vad-betyder-det",
          text: "Läs hur vinst per aktie hänger ihop med P/E-talet",
        },
      ],
    },
    {
      heading: "7. Kassaflöde – vinsten är inte samma sak som pengar i kassan",
      paragraphs: [
        "Resultat och kassaflöde är inte samma sak. Ett företag kan redovisa hög vinst samtidigt som kassaflödet är svagt.",
        "Det kan bland annat bero på att kunder ännu inte har betalat, att lagren byggts upp, att stora investeringar genomförts eller att rörelsekapitalet förändrats.",
        "Fritt kassaflöde försöker förenklat visa hur mycket pengar verksamheten genererar efter nödvändiga investeringar. Pengarna kan sedan användas till exempelvis utdelningar, återköp, amorteringar, förvärv eller nya investeringar.",
      ],
      subsections: [
        {
          subheading: "Ericsson visar varför kassaflödet måste läsas separat",
          paragraphs: [
            "Ericssons fria kassaflöde före M&A var 2,6 miljarder kronor i Q2 2025, jämfört med 7,6 miljarder året innan. Kassaflödet hade alltså minskat kraftigt samtidigt som flera resultatmått förbättrades.",
            "Ericsson förklarade samtidigt att Q2 2024 hade gynnats av en stark frigörelse av rörelsekapital. Exemplet visar varför stigande vinst inte automatiskt betyder stigande kassaflöde.",
          ],
        },
      ],
      callout:
        "Stigande resultat och fallande kassaflöde är inte automatiskt ett problem – men det är en tydlig signal om att du bör ta reda på varför.",
    },
    {
      heading: "8. Balansräkningen – hur starkt står företaget?",
      paragraphs: [
        "Resultaträkningen berättar vad som hänt under perioden. Balansräkningen visar företagets ekonomiska ställning vid en viss tidpunkt.",
      ],
      bullets: [
        "kassa och likvida medel",
        "räntebärande skulder",
        "tillgångar",
        "eget kapital",
        "kundfordringar och lager",
      ],
      paragraphsAfterLists: [
        "Ett vanligt mått är nettoskuld, alltså räntebärande skulder minus kassa och likvida medel. Om kassan är större än skulderna kan bolaget i stället ha nettokassa.",
        "Ericsson hade vid utgången av Q2 2025 en nettokassa på cirka 36,0 miljarder kronor, jämfört med cirka 13,1 miljarder året innan.",
        "En stark balansräkning kan ge större utrymme för investeringar, förvärv, utdelningar och motståndskraft under svagare perioder. Samtidigt måste skuldsättning alltid sättas i relation till bolagets kassaflöde, resultat och bransch.",
      ],
    },
    {
      heading: "9. Läs vd-ordet – men med kritiska ögon",
      paragraphs: [
        "Rapporten innehåller vanligtvis kommentarer från vd:n. Hoppa inte över dem. Här går det ofta att hitta information om efterfrågan, priser, kostnader, geografiska marknader, investeringar och framtidsutsikter.",
        "Men kom ihåg vem som skriver. Bolagsledningen presenterar den egna verksamheten. Leta därför främst efter konkreta förändringar snarare än positiva formuleringar.",
        "I Ericssons Q2 2025 beskrev vd Börje Ekholm bland annat fortsatt tillväxt i Nord- och Sydamerika, en stabilisering i Europa, fortsatta effektivitetsåtgärder och ökade investeringar inom AI.",
      ],
      bullets: [
        "Vad har förändrats sedan förra rapporten?",
        "Har ledningen blivit mer positiv eller mer försiktig?",
        "Finns ett konkret problem som återkommer kvartal efter kvartal?",
        "Har bolaget ändrat sina mål eller sina framtidsutsikter?",
      ],
    },
    {
      heading: "10. Jämför med rätt period",
      paragraphs: [
        "En klassisk nybörjarmiss är att jämföra Q2 med Q1 och sedan dra slutsatsen att verksamheten vuxit eller krympt. Många företag är säsongsberoende.",
        "Därför jämförs kvartalsrapporter ofta i första hand med samma kvartal föregående år. Q2 2026 jämförs alltså normalt med Q2 2025.",
        "YoY betyder year over year och syftar på jämförelsen med samma period året innan. QoQ betyder quarter over quarter och jämför i stället med närmast föregående kvartal. Båda kan vara användbara, men de svarar på olika frågor.",
      ],
    },
    {
      heading: "11. Analytikerkonsensus – därför kan en bra rapport få aktien att falla",
      paragraphs: [
        "En bra rapport behöver inte betyda att aktien stiger. Börsen försöker hela tiden värdera framtiden och inför en rapport finns ofta prognoser för omsättning, resultat, marginaler och vinst per aktie.",
        "När flera analytikers prognoser sammanställs kallas det ofta analytikerkonsensus.",
        "Tänk dig att ett bolag ökar vinsten med 20 procent. Det låter starkt. Men om marknaden hade räknat med en ökning på 30 procent kan rapporten ändå uppfattas som en besvikelse.",
        "Det omvända kan också inträffa. Vinsten kan minska och aktien ändå stiga om utfallet var bättre än marknaden hade befarat.",
      ],
      callout:
        "Aktiemarknaden reagerar ofta på utfallet jämfört med förväntningarna – inte bara på utfallet jämfört med förra året.",
    },
    {
      heading: "12. Framtidsutsikterna kan vara viktigare än kvartalet som gått",
      paragraphs: [
        "En kvartalsrapport beskriver till stor del det som redan har hänt. Aktiemarknaden försöker däremot värdera det som ska hända framöver.",
        "Därför kan bolagets guidning och framtidsutsikter vara minst lika viktiga som kvartalets siffror. Leta efter kommentarer om efterfrågan, försäljning, marginaler, kostnader, investeringar och risker.",
        "Om ledningen sänker sina förväntningar kan aktien reagera negativt även om kvartalet som just rapporterades var starkt.",
      ],
    },
    {
      heading: "Ericsson Q2 2025 – rapporten sammanfattad på några minuter",
      table: {
        headers: ["Del", "Q2 2025", "Vad det lär oss"],
        rows: [
          [
            "Nettoomsättning",
            "56,1 mdkr, -6 % rapporterat",
            "Valuta kan göra den rapporterade utvecklingen svagare än den underliggande.",
          ],
          [
            "Organisk försäljning",
            "+2 %",
            "Den befintliga verksamheten kan utvecklas annorlunda än den rapporterade omsättningen.",
          ],
          [
            "Justerad bruttomarginal",
            "48,0 % mot 43,9 %",
            "Marginaler visar hur mycket av försäljningen som blir kvar efter kostnader.",
          ],
          [
            "Justerad EBITA",
            "7,4 mdkr mot 4,1 mdkr",
            "Resultatet förbättrades kraftigt, men behöver läsas tillsammans med marginal och justeringar.",
          ],
          [
            "Justerad EBITA-marginal",
            "13,2 % mot 6,8 %",
            "Bolaget genererade mer resultat per försäljningskrona.",
          ],
          [
            "Periodens resultat",
            "4,6 mdkr mot -11,0 mdkr",
            "Jämförelseperioden påverkades av en stor nedskrivning och måste därför förstås i sitt sammanhang.",
          ],
          [
            "Fritt kassaflöde före M&A",
            "2,6 mdkr mot 7,6 mdkr",
            "Vinst och kassaflöde kan utvecklas åt olika håll.",
          ],
          [
            "Nettokassa",
            "36,0 mdkr",
            "Balansräkningen visar bolagets finansiella styrka vid rapportperiodens slut.",
          ],
        ],
      },
      paragraphsAfterLists: [
        "Poängen är inte att avgöra om Ericsson var en bra eller dålig investering. Bolaget används här för att visa hur flera delar av samma rapport kan peka åt olika håll och varför en rapport aldrig bör reduceras till en enda siffra.",
      ],
    },
    {
      heading: "DivLabs checklista – 10 saker att kontrollera när rapporten kommer",
      numberedItems: [
        "Omsättning: Ökar eller minskar försäljningen jämfört med samma kvartal förra året?",
        "Organisk tillväxt: Hur utvecklas den befintliga verksamheten när valuta, förvärv och avyttringar räknas bort?",
        "Marginaler: Behåller företaget en större eller mindre del av varje försäljningskrona?",
        "Rörelseresultat: Hur utvecklas EBIT, EBITA eller det resultatmått företaget normalt använder?",
        "Justeringar: Finns stora engångsposter eller kostnader som bolaget räknat bort?",
        "Resultat per aktie: Hur utvecklas vinsten räknat per aktie?",
        "Kassaflöde: Genererar verksamheten faktiskt pengar?",
        "Balansräkning: Har nettoskulden ökat eller minskat, eller har bolaget nettokassa?",
        "Förväntningar: Var resultatet bättre eller sämre än marknaden räknat med?",
        "Framtiden: Vad säger ledningen om efterfrågan, kostnader, marginaler och kommande kvartal?",
      ],
      paragraphsAfterLists: [
        "Du behöver inte läsa hundra sidor från början till slut varje gång. Börja med dessa tio punkter och fördjupa dig sedan där något sticker ut.",
      ],
    },
    {
      heading: "Du behöver inte förstå allt på en gång",
      paragraphs: [
        "Första gången du öppnar en kvartalsrapport kan den kännas betydligt mer komplicerad än den egentligen är.",
        "Börja med några få delar: omsättning, marginal, rörelseresultat, kassaflöde, skuld och framtidsutsikter. När du förstår sambanden mellan dem blir resten mycket enklare.",
        "Efter några rapporter börjar samma begrepp återkomma. Det är då rapporten går från att vara en sida full av siffror till att bli vad den egentligen är: en berättelse om hur företaget utvecklas.",
      ],
      relatedLinks: [
        {
          slug: "borsens-ordlista",
          text: "Börsens ordlista – vanliga börstermer förklarade",
        },
        {
          slug: "pe-tal-vad-betyder-det",
          text: "P/E-tal – vad betyder det?",
        },
        {
          slug: "vad-ar-en-aktie",
          text: "Vad är en aktie?",
        },
      ],
    },
  ],
  sources: [
    {
      href: "https://www.ericsson.com/sv/press-releases/2025/7/ericsson-reports-second-quarter-results-2025",
      text: "Ericsson – rapporterar andra kvartalet 2025",
    },
    {
      href: "https://www.ericsson.com/en/investors/financial-calendar/2025/q2-2025",
      text: "Ericsson – Q2 2025 rapport och investerarmaterial",
    },
  ],
};

export default article;
