import type { LearningArticle } from "../types";

const article: LearningArticle = {
  slug: "aktieaterkop-varfor-koper-bolag-egna-aktier",
  title: "Aktieåterköp – varför köper bolag sina egna aktier?",
  seoTitle: "Aktieåterköp – så påverkas aktier, EPS och ägare",
  description:
    "Vad är aktieåterköp och varför gör börsbolag dem? Lär dig hur återköp påverkar utestående aktier, vinst per aktie, ägarandel och utdelning.",
  excerpt:
    "När ett bolag köper tillbaka sina egna aktier kan antalet utestående aktier minska och vinst per aktie stiga. Här förklarar vi hur återköp fungerar och när de kan skapa värde.",
  category: "Aktier & analys",
  level: "Nybörjare",
  publishedAt: "2026-08-24",
  updatedAt: "2026-08-24",
  authorName: "DivLab Redaktion",
  coverImage: "/learning/ChatGPT Image 24 aug. 2026 20_33_12.png",
  coverImageAlt:
    "Spansk kuststig med utsikt över klarblått Medelhav och rubriken Aktieåterköp – varför köper bolag sina egna aktier?",
  thumbnailObjectPosition: "left center",
  relatedArticleSlugs: [
    "sa-laser-du-en-kvartalsrapport",
    "pe-tal-vad-betyder-det",
    "direktavkastning-och-utdelningssakerhet",
    "borsens-ordlista",
  ],
  showDefaultDisclaimer: true,
  intro: [
    "När ett börsbolag tjänar mer pengar än det behöver för den löpande verksamheten måste ledningen och styrelsen bestämma vad kapitalet ska användas till. Pengarna kan investeras i verksamheten, användas till förvärv, betala av skulder eller delas ut till aktieägarna.",
    "Ett annat alternativ är aktieåterköp. Det innebär att bolaget använder sina egna pengar för att köpa aktier i det egna företaget.",
    "För aktieägaren kan det få flera effekter. Antalet utestående aktier kan minska, vinst per aktie kan öka och den som behåller sina aktier kan få en större andel av de aktier som finns ute hos externa ägare. Men ett återköp är inte automatiskt bra. Precis som vid andra investeringar spelar priset stor roll.",
  ],
  sections: [
    {
      heading: "Vad är ett aktieåterköp?",
      paragraphs: [
        "Ett aktieåterköp innebär att ett företag förvärvar aktier i det egna bolaget. Förenklat kan man tänka sig att ett börsbolag går ut på marknaden och köper sina egna aktier, även om återköpen i praktiken omfattas av särskilda regler.",
        "Anta att ett företag har 100 miljoner aktier totalt, en aktiekurs på 100 kronor och 1 miljard kronor som ska användas till återköp. Om aktiekursen för enkelhetens skull hela tiden ligger kvar på 100 kronor skulle bolaget kunna köpa tillbaka 10 miljoner aktier.",
        "Bolaget innehar då 10 miljoner egna aktier medan 90 miljoner aktier fortfarande är utestående hos andra ägare.",
        "Det totala registrerade antalet aktier behöver inte direkt minska bara för att bolaget har köpt tillbaka aktier. Om bolaget behåller de återköpta aktierna som egna aktier kan det fortfarande finnas 100 miljoner aktier totalt, men endast 90 miljoner är utestående hos externa aktieägare. Om de återköpta aktierna senare dras in minskar även det totala antalet aktier.",
      ],
      callout:
        "Återköpta aktier och indragna aktier är inte samma sak. Ett återköp kan minska antalet utestående aktier utan att det registrerade totala antalet aktier omedelbart minskar.",
    },
    {
      heading: "Varför köper företag tillbaka sina egna aktier?",
      subsections: [
        {
          subheading: "Bolaget har mer kapital än det behöver",
          paragraphs: [
            "Ett lönsamt företag kan generera mer pengar än vad som behövs för den löpande verksamheten. Styrelsen måste då avgöra vad som är den bästa användningen av kapitalet.",
          ],
          bullets: [
            "nya investeringar",
            "forskning och utveckling",
            "förvärv",
            "amortering av skulder",
            "utdelning",
            "aktieåterköp",
          ],
          paragraphsAfterLists: [
            "Om bolaget redan har en stark balansräkning och inte hittar tillräckligt attraktiva investeringar kan återköp vara ett sätt att föra tillbaka kapital till aktieägarna.",
          ],
        },
        {
          subheading: "Bolaget anser att den egna aktien är attraktivt värderad",
          paragraphs: [
            "Ett återköp kan också vara ett sätt för företaget att investera i sig självt. Om ledningen bedömer att aktien handlas till ett attraktivt pris kan bolaget välja att köpa tillbaka aktier.",
            "Det kan vara gynnsamt för de kvarvarande aktieägarna om aktierna köps till ett pris som är lågt i förhållande till företagets långsiktiga värde. Men samma princip fungerar åt andra hållet. Om ett företag använder stora summor till återköp när den egna aktien är mycket högt värderad kan kapitalet användas mindre effektivt.",
          ],
        },
      ],
      callout:
        "Ett stort återköpsprogram är inte automatiskt positivt. Priset bolaget betalar spelar roll.",
    },
    {
      heading: "Återköp kan höja vinst per aktie",
      paragraphs: [
        "En av de tydligaste effekterna av återköp syns i vinst per aktie, ofta kallat EPS efter engelska earnings per share.",
        "Förenklat beräknas vinst per aktie genom att vinsten som tillhör stamaktieägarna ställs mot antalet utestående aktier.",
      ],
      calculation: {
        title: "Exempel: samma vinst – färre utestående aktier",
        lines: [
          "Vinst: 1 miljard kronor",
          "100 miljoner utestående aktier → 10 kronor i vinst per aktie",
          "Efter återköp: 90 miljoner utestående aktier",
          "1 000 000 000 / 90 000 000 ≈ 11,11 kronor per aktie",
          "Vinst per aktie har ökat med cirka 11 procent trots att den totala vinsten är oförändrad",
        ],
      },
      paragraphsAfterLists: [
        "Om ett bolag meddelar att vinst per aktie har ökat betyder det därför inte automatiskt att företagets totala vinst har ökat lika mycket. En del av ökningen kan komma från att antalet utestående aktier har minskat.",
        "I en verklig års- eller kvartalsrapport är beräkningen mer avancerad. IAS 33 använder det viktade genomsnittliga antalet utestående aktier under perioden. Ett stort återköp sent på året får därför mindre effekt på hela årets redovisade EPS än om samma återköp genomförs tidigt på året.",
      ],
      relatedLinks: [
        {
          slug: "sa-laser-du-en-kvartalsrapport",
          text: "Lär dig hur vinst per aktie används när du läser en kvartalsrapport",
        },
        {
          slug: "pe-tal-vad-betyder-det",
          text: "Läs hur vinst per aktie hänger ihop med P/E-talet",
        },
      ],
    },
    {
      heading: "Din relativa andel av de utestående aktierna kan öka",
      paragraphs: [
        "Återköp får ytterligare en effekt för den aktieägare som inte säljer. Anta att ett företag har 100 miljoner utestående aktier och att du äger 1 000 av dem. Din andel av de utestående aktierna är då 0,001 procent.",
        "Om bolaget köper tillbaka 10 miljoner aktier och du inte säljer finns 90 miljoner aktier kvar utestående hos externa ägare. Du äger fortfarande 1 000 aktier, vilket motsvarar ungefär 0,00111 procent av de utestående aktierna.",
        "Din relativa andel av de utestående aktierna har alltså ökat trots att du inte har köpt fler aktier.",
        "Om bolaget behåller de återköpta aktierna som egna aktier har det registrerade totala antalet aktier inte nödvändigtvis minskat. Egna aktier behandlas däremot annorlunda från aktier som ligger hos externa ägare. Enligt svensk aktiebolagslag ger aktier som bolaget självt innehar bland annat inte rätt till vinstutdelning.",
      ],
    },
    {
      heading: "Men har du automatiskt blivit rikare?",
      paragraphs: [
        "Nej. När företaget köper tillbaka aktier för exempelvis 1 miljard kronor försvinner samtidigt 1 miljard kronor ur bolagets kassa.",
        "Man kan därför inte säga att varje aktie automatiskt blir mer värd bara för att antalet utestående aktier minskar. Bolaget har färre utestående aktier, men också mindre pengar kvar.",
        "Det som avgör om återköpet skapar värde är bland annat vilket pris bolaget betalar för aktierna och vad pengarna annars hade kunnat användas till. Det är själva kapitalallokeringen som är det intressanta.",
      ],
    },
    {
      heading: "Aktieåterköp eller utdelning – vad är skillnaden?",
      paragraphs: [
        "Utdelningar och återköp är två olika sätt att föra kapital från företaget till aktieägarna.",
        "Vid en vanlig utdelning betalar företaget ut pengar till aktieägarna. Om utdelningen är 5 kronor per aktie och du äger 100 aktier får du 500 kronor i utdelning.",
        "Vid återköp använder företaget i stället pengarna till att köpa aktier. De aktieägare som säljer sina aktier får pengar. Den som behåller sina aktier får normalt ingen direkt kontant utbetalning från själva återköpet. I stället kan antalet utestående aktier minska.",
      ],
      table: {
        headers: ["", "Utdelning", "Aktieåterköp"],
        rows: [
          ["Pengar lämnar bolaget", "Ja", "Ja"],
          ["Aktieägaren får automatiskt pengar", "Ja, om aktien ger rätt till utdelningen", "Nej"],
          ["Antalet utestående aktier minskar", "Normalt nej", "Kan göra det"],
          ["Kan höja EPS vid oförändrad vinst", "Inte genom färre aktier", "Ja"],
          ["Kvarvarande ägares andel av utestående aktier kan öka", "Normalt nej", "Ja"],
        ],
      },
      paragraphsAfterLists: [
        "Många företag använder båda metoderna. Ett bolag kan alltså både lämna ordinarie utdelning och köpa tillbaka aktier under samma år.",
        "Det finns inget generellt svar på om återköp eller utdelning är bäst. Det beror bland annat på företagets ekonomi, värderingen av aktien, investeringsmöjligheterna och aktieägarens situation.",
      ],
      relatedLinks: [
        {
          slug: "direktavkastning-och-utdelningssakerhet",
          text: "Läs mer om utdelningar och utdelningssäkerhet",
        },
      ],
    },
    {
      heading: "När kan återköp vara bra?",
      paragraphs: [
        "Tänk dig ett företag med stabil lönsamhet, starkt kassaflöde, låg skuldsättning, tillräckligt kapital för verksamheten och begränsat behov av stora nya investeringar. Om aktien samtidigt är rimligt eller lågt värderad kan återköp vara ett effektivt sätt att använda överskottskapital.",
        "Om verksamheten dessutom fortsätter att växa kan kombinationen bli kraftfull. Företagets totala vinst ökar samtidigt som vinsten fördelas över färre utestående aktier.",
      ],
    },
    {
      heading: "När kan återköp vara dåliga?",
      paragraphs: [
        "Återköp kan också vara en dålig användning av pengar. Ett företag med stora skulder, svagt kassaflöde eller omfattande investeringsbehov kan ha bättre användning för kapitalet.",
        "Detsamma gäller om bolaget köper tillbaka stora mängder aktier till en mycket hög värdering eller skuldsätter sig kraftigt för att finansiera återköpen.",
        "Ett företag kan dessutom göra misstaget att köpa tillbaka stora mängder aktier när kursen är hög och sedan tvingas skaffa nytt kapital när tiderna blir sämre. Därför räcker det inte att se ordet återköp och automatiskt anta att nyheten är positiv.",
      ],
    },
    {
      heading: "Återköp kan också motverka utspädning",
      paragraphs: [
        "Många börsbolag använder aktier eller aktierelaterade program som ersättning till ledning och anställda. Om nya aktier tillkommer kan befintliga aktieägare bli utspädda. Det innebär förenklat att deras befintliga aktier representerar en mindre andel än tidigare.",
        "Bolaget kan använda återköp för att helt eller delvis motverka den effekten. Därför bör man inte bara titta på hur många miljarder kronor ett företag har använt till återköp.",
      ],
      callout:
        "Den bättre frågan är: har antalet utestående aktier faktiskt minskat?",
    },
    {
      heading: "Titta på utvecklingen över flera år",
      paragraphs: [
        "Ett bra sätt att bedöma återköp är att titta på antalet utestående aktier över längre tid. Om antalet successivt minskar från exempelvis 100 miljoner till 97, 93 och sedan 89 miljoner syns effekten tydligt.",
        "Om bolaget däremot annonserar stora återköp samtidigt som antalet utestående aktier står still eller ökar bör du undersöka varför. Nya aktier kan samtidigt ha tillkommit genom exempelvis ersättningsprogram eller andra emissioner.",
      ],
    },
    {
      heading: "Återköp gör inte verksamheten bättre",
      paragraphs: [
        "Ett aktieåterköp kan påverka siffror per aktie, men det förbättrar inte automatiskt företagets underliggande verksamhet.",
      ],
      bullets: [
        "omsättningen ökar inte automatiskt",
        "fler kunder tillkommer inte automatiskt",
        "rörelsemarginalen stiger inte automatiskt",
        "den totala vinsten ökar inte automatiskt",
        "kassaflödet från verksamheten förbättras inte automatiskt",
      ],
      paragraphsAfterLists: [
        "Det är därför viktigt att skilja på resultattillväxt och tillväxt i resultat per aktie. Ett starkt bolag kan ha båda, men ibland kommer en del av EPS-tillväxten helt enkelt från att antalet utestående aktier har minskat.",
      ],
    },
    {
      heading: "Svenska regler för aktieåterköp",
      paragraphs: [
        "Svenska bolag kan inte köpa tillbaka egna aktier helt fritt. Aktiebolagslagen innehåller särskilda regler om förvärv av egna aktier.",
        "För de svenska publika aktiebolag som omfattas av de särskilda återköpsreglerna finns bland annat begränsningar för hur stora innehav av egna aktier bolaget får bygga upp. Enligt huvudregeln får bolagets innehav av egna aktier efter förvärvet inte överstiga en tiondel, alltså 10 procent, av samtliga aktier i bolaget.",
        "Beslut om återköp fattas av bolagsstämman, men bolagsstämman kan också bemyndiga styrelsen att fatta beslut inom de ramar som stämman har bestämt. Ett sådant stämmobeslut kräver kvalificerad majoritet enligt aktiebolagslagen.",
        "Förvärv av egna aktier behandlas normalt som en värdeöverföring enligt aktiebolagslagen. Reglerna om skyddet för bolagets kapital och ekonomiska ställning är därför relevanta.",
        "För noterade bolag finns dessutom regler om bland annat offentliggörande, rapportering och marknadsmissbruk. Finansinspektionen beskriver de svenska skyldigheterna och reglerna kring återköpsprogram.",
        "Vid publiceringen den 24 augusti 2026 omfattar den särskilda bestämmelsen i 19 kap. 13 § aktiebolagslagen publika aktiebolag vars aktier är upptagna till handel på en reglerad marknad eller en motsvarande marknad utanför EES. En beslutad lagändring träder i kraft den 5 december 2026 och utvidgar bestämmelsen till att även omfatta MTF-plattformar.",
      ],
      callout:
        "Regler kan ändras. För juridiska detaljer om ett specifikt återköpsprogram bör bolagets stämmobeslut, pressmeddelanden och aktuella regler hos Finansinspektionen kontrolleras.",
    },
    {
      heading: "Så läser du en nyhet om ett återköpsprogram",
      numberedItems: [
        "Hur stort är återköpet i förhållande till bolagets börsvärde?",
        "Hur stor del av de utestående aktierna kan programmet motsvara?",
        "Minskar antalet utestående aktier faktiskt över tid?",
        "Hur stark är balansräkningen och hur finansieras återköpet?",
        "Hur ser det fria kassaflödet ut?",
        "Till vilken värdering köper bolaget tillbaka aktier?",
        "Vad hade bolaget kunnat göra med pengarna i stället?",
      ],
      paragraphsAfterLists: [
        "Det sista är kärnan i kapitalallokering. Pengarna hade kanske kunnat användas till expansion, nya produkter, forskning, förvärv, skuldminskning, utdelning eller som finansiell buffert.",
        "Ett bra återköp är därför inte bara ett återköp. Det är ett återköp som är bättre än de andra realistiska alternativen för kapitalet.",
      ],
    },
    {
      heading: "Ett enkelt sätt att tänka på aktieåterköp",
      paragraphs: [
        "Föreställ dig att en verksamhet ägs av tio personer. Verksamheten har byggt upp ett stort överskott och använder en del av pengarna för att köpa ut en av ägarna.",
        "De nio kvarvarande ägarna har inte satsat några nya pengar, men det finns nu färre externa ägare som delar på verksamhetens framtida resultat. Samtidigt har verksamheten mindre pengar kvar eftersom kapital användes för att köpa ut den tionde ägaren.",
        "Färre ägare är alltså inte ensamt det som skapar värde. Det avgörande är vad verksamheten betalade och vad pengarna annars hade kunnat användas till. Samma grundprincip gäller för aktieåterköp.",
      ],
    },
    {
      heading: "Sammanfattning",
      paragraphs: [
        "Ett aktieåterköp innebär att ett företag använder kapital för att köpa tillbaka aktier i det egna bolaget. Det kan leda till färre utestående aktier.",
        "Om företagets totala vinst är oförändrad samtidigt som antalet utestående aktier minskar kan vinsten per aktie öka. Den aktieägare som behåller sina aktier kan också få en större relativ andel av de utestående aktierna.",
        "Men återköp skapar inte automatiskt värde. När företaget köper aktier lämnar samtidigt pengar bolaget. Priset, finansieringen, skuldsättningen, kassaflödet och alternativen för kapitalet måste därför vägas in.",
      ],
      numberedItems: [
        "Vilket pris betalar bolaget för sina aktier?",
        "Hur finansieras återköpet?",
        "Hur ser företagets skuldsättning och kassaflöde ut?",
        "Minskar antalet utestående aktier faktiskt?",
        "Vilka andra möjligheter hade bolaget att använda kapitalet?",
      ],
      paragraphsAfterLists: [
        "Nästa gång du läser att ett börsbolag startar ett återköpsprogram behöver du därför inte stanna vid rubriken. Den viktigare frågan är om bolaget köper tillbaka sina aktier på ett sätt som faktiskt verkar skapa långsiktigt värde för de kvarvarande aktieägarna.",
      ],
    },
  ],
  sources: [
    {
      href: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/aktiebolagslag-2005551_sfs-2005-551/",
      text: "Sveriges riksdag – Aktiebolagslag (2005:551)",
    },
    {
      href: "https://www.fi.se/sv/marknad/om-marknadsmissbruk/undantag---aterkopsprogram/",
      text: "Finansinspektionen – Återköpsprogram och marknadsmissbruksregler",
    },
    {
      href: "https://www.ifrs.org/issued-standards/list-of-standards/ias-33-earnings-per-share/",
      text: "IFRS Foundation – IAS 33 Earnings per Share",
    },
  ],
};

export default article;
