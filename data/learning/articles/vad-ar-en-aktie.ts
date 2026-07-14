import type { LearningArticle } from "../types";

const article: LearningArticle = {
  slug: "vad-ar-en-aktie",
  title: "Vad är en aktie? En guide för nybörjare",
  seoTitle: "Vad är en aktie? Så fungerar aktier för nybörjare",
  description:
    "En aktie är en ägarandel i ett företag. Här går vi igenom hur aktier fungerar, hur avkastning kan uppstå och vilka risker du behöver förstå.",
  excerpt:
    "En aktie är en ägarandel i ett företag. Här går vi igenom hur aktier fungerar, hur avkastning kan uppstå och vilka risker du behöver förstå.",
  category: "Aktier",
  level: "Nybörjare",
  publishedAt: "2026-07-14",
  updatedAt: "2026-07-14",
  coverImage: "/learning/vad-ar-en-aktie.png",
  coverImageAlt:
    "Anteckningsbok som förklarar att en aktie är en ägarandel i ett företag, bredvid börsskärm och DivLab-mugg.",
  showDefaultDisclaimer: true,
  relatedArticleSlugs: ["borja-investera-pa-borsen"],
  intro: [
    "En aktie är en ägarandel i ett aktiebolag. När du köper en aktie blir du alltså delägare i företaget – även om din andel kan vara mycket liten. Som aktieägare kan du få del av företagets framtida värdeutveckling, ha rätt att rösta på bolagsstämman och i vissa fall få utdelning.",
    "Det betyder däremot inte att avkastningen är säker. En aktie kan både stiga och falla i värde, utdelningen kan sänkas eller utebli och ett företag som misslyckas kan i värsta fall göra att aktien blir värdelös.",
    "I den här guiden går vi igenom vad en aktie representerar, varför företag ger ut aktier, hur handeln fungerar och vilka rättigheter, möjligheter och risker som följer med aktieägandet.",
  ],
  takeaways: [
    "En aktie är en ägarandel i ett aktiebolag.",
    "Företag kan ge ut aktier för att få in kapital.",
    "Aktiekursen påverkas av utbud, efterfrågan, bolagets utveckling och marknadens förväntningar.",
    "Avkastning kan komma från kursuppgång och eventuell utdelning.",
    "Aktier innebär alltid risk och värdet kan både stiga och falla.",
    "Riskspridning minskar beroendet av hur ett enskilt företag utvecklas.",
  ],
  sources: [
    {
      href: "https://www.fi.se/sv/for-konsumenter/spara/investera-i-aktier/",
      text: "Finansinspektionen — Investera i aktier",
    },
    {
      href: "https://www.fi.se/sv/for-konsumenter/spara/fem-tips-for-ditt-sparande/",
      text: "Finansinspektionen — Fem tips för ditt sparande",
    },
    {
      href: "https://www.konsumenternas.se/sparande--pension/sparande/sa-fungerar-vardepapper/valja-typ-av-investering/",
      text: "Konsumenternas — Välja typ av investering",
    },
    {
      href: "https://www.konsumenternas.se/sparande--pension/sparande/sa-fungerar-vardepapper/handel-med-vardepapper/",
      text: "Konsumenternas — Handel med värdepapper",
    },
    {
      href: "https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/aktier/aktiebokochaktiebrev.501.html",
      text: "Bolagsverket — Aktiebok och aktiebrev",
    },
    {
      href: "https://bolagsverket.se/foretag/aktiebolag/attagaaktier.801.html",
      text: "Bolagsverket — Att äga aktier",
    },
    {
      href: "https://bolagsverket.se/foretag/aktiebolag/startaaktiebolag/aktier/olikaaktieslag.503.html",
      text: "Bolagsverket — Olika aktieslag",
    },
    {
      href: "https://bolagsverket.se/foretag/aktiebolag/drivaaktiebolag/delauppellerlaggasammanaktier.683.html",
      text: "Bolagsverket — Dela upp eller lägga samman aktier",
    },
    {
      href: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/aktiebolagslag-2005551_sfs-2005-551/",
      text: "Sveriges riksdag — Aktiebolagslag (2005:551)",
    },
    {
      href: "https://www.skatteverket.se/privat/skatter/vardepapper/investeringssparkontoisk.4.5fc8c94513259a4ba1d800037851.html",
      text: "Skatteverket — Investeringssparkonto",
    },
    {
      href: "https://www.euroclear.com/sweden/sv/aktiebolag2/om-aktiebocker.html",
      text: "Euroclear Sweden — Om aktieböcker",
    },
  ],
  sections: [
    {
      heading: "Vad innebär det att äga en aktie?",
      paragraphs: [
        "Ett aktiebolags ägande är uppdelat i ett visst antal aktier. Varje aktie motsvarar en andel av bolaget. Den som äger en eller flera aktier kallas aktieägare.",
        "Anta att ett företag har gett ut en miljon aktier. Om du äger 1 000 av dem äger du 0,1 procent av aktierna i bolaget. I ett stort börsnoterat företag är en privatpersons ägarandel ofta betydligt mindre, men principen är densamma: aktien representerar en del av företaget.",
        "Vem som äger aktierna framgår av företagets aktiebok. Alla svenska aktiebolag måste ha en aktiebok. För avstämningsbolag kan aktieboken hanteras genom Euroclear Sweden. Om aktierna ligger i en depå kan de vara förvaltarregistrerade, vilket innebär att förvaltaren syns i aktieboken medan den underliggande ägaren framgår av förvaltarens register.",
        "Det är viktigt att skilja på att äga en aktie och att bara följa aktiens pris. När du äger en vanlig aktie äger du ett värdepapper kopplat till ägandet i företaget. Du har inte lånat ut pengar till bolaget, som vid en obligation, och du har inte köpt en fondandel som indirekt äger flera värdepapper.",
      ],
    },
    {
      heading: "Varför ger företag ut aktier?",
      paragraphs: [
        "Ett företag kan ge ut aktier för att få in kapital. Pengarna kan exempelvis användas till att starta verksamheten, utveckla produkter, expandera till nya marknader, köpa andra företag eller stärka bolagets ekonomi.",
        "När ett aktiebolag bildas skjuter ägarna till kapital och får aktier i utbyte. Ett befintligt företag kan senare ge ut fler aktier genom en nyemission. Då säljs nya aktier till nuvarande eller nya investerare och kapitalet går in i bolaget.",
        "När du köper en redan existerande aktie på börsen går pengarna däremot normalt till investeraren som säljer aktien, inte direkt till företaget. Handeln sker då på den så kallade andrahandsmarknaden.",
        "En fungerande andrahandsmarknad är viktig eftersom den gör det enklare för investerare att köpa och sälja sina innehav. Den gör också att marknaden löpande kan sätta ett pris på aktierna.",
      ],
    },
    {
      heading: "Börsnoterade och onoterade aktier",
      paragraphs: [
        "En börsnoterad aktie är upptagen till handel på en marknadsplats där köp- och säljorder kan mötas, priser publiceras och avslut genomföras enligt marknadsplatsens regler.",
        "En onoterad aktie handlas inte på samma organiserade sätt. Det kan därför vara svårare att hitta en köpare, bedöma ett rimligt värde och få tillgång till oberoende information om företaget.",
        "Att ett företag är börsnoterat innebär inte att aktien är säker eller att bolaget kommer att lyckas. Noteringen gör däremot normalt handeln mer organiserad och transparent än i ett onoterat bolag.",
        "Det finns även olika typer av marknadsplatser. Nasdaq Stockholm är en reglerad marknad, medan Nasdaq First North är en handelsplattform som inte är en reglerad marknad. Kraven och regelverken kan därför skilja sig.",
        "För en nybörjare räcker det alltså inte att se att en aktie går att köpa i en app. Det är också viktigt att förstå var den handlas och vilken information bolaget måste lämna.",
      ],
    },
    {
      heading: "Vilka rättigheter har en aktieägare?",
      paragraphs: [
        "En aktie kan ge både ekonomiska rättigheter och rätt till inflytande. Exakt vilka rättigheter som följer med en aktie beror på aktiebolagslagen och företagets bolagsordning.",
      ],
      subsections: [
        {
          subheading: "Rösträtt på bolagsstämman",
          paragraphs: [
            "Aktieägare kan normalt delta och rösta på bolagsstämman. Där fattas bland annat beslut om styrelse, hur årets resultat ska disponeras och andra viktiga frågor för bolaget.",
            "En småsparares röst väger betydligt mindre än en storägares, men rätten att delta är ändå en viktig del av vad aktieägandet innebär.",
            "För förvaltarregistrerade aktier kan ägaren behöva begära tillfällig rösträttsregistrering genom sin bank eller förvaltare inför bolagsstämman.",
          ],
        },
        {
          subheading: "Rätt till eventuell utdelning",
          paragraphs: [
            "Om bolaget har möjlighet att dela ut kapital kan aktieägarna få utdelning. Utdelning är däremot inte ränta och inte en garanterad betalning.",
            "Styrelsen lämnar vanligtvis ett utdelningsförslag, men det är bolagsstämman som fattar beslutet inom de ramar som följer av lag och bolagets ekonomiska situation.",
            "Utdelningen kan:",
          ],
          bullets: [
            "höjas",
            "sänkas",
            "skjutas upp",
            "eller utebli helt",
          ],
          paragraphsAfterLists: [
            "När ett företag delar ut pengar lämnar kapital bolaget. Utdelning ska därför inte betraktas som gratis avkastning.",
            "När aktien börjar handlas utan rätt till den beslutade utdelningen påverkas priset ofta nedåt med ungefär utdelningsbeloppet. Samtidigt kan andra nyheter och marknadsrörelser påverka kursen.",
          ],
        },
        {
          subheading: "Rätt vid vissa bolagshändelser",
          paragraphs: [
            "Aktieägare kan i vissa situationer få företrädesrätt när bolaget ger ut nya aktier.",
            "Om en aktieägare inte deltar i en nyemission samtidigt som antalet aktier ökar kan ägarens procentuella andel av bolaget minska. Det kallas utspädning.",
            "De exakta villkoren varierar mellan olika emissioner.",
          ],
        },
      ],
    },
    {
      heading: "A-aktier, B-aktier och andra aktieslag",
      paragraphs: [
        "Grundprincipen i svensk aktiebolagsrätt är att alla aktier har lika rätt i bolaget. Företagets bolagsordning kan dock ange att det finns olika aktieslag med olika rättigheter.",
      ],
      subsections: [
        {
          subheading: "A-aktier och B-aktier",
          paragraphs: [
            "I svenska börsbolag används beteckningarna A och B ofta för aktier med olika röstvärde. A-aktien har ofta fler röster än B-aktien, men detta är ingen universell regel.",
            "Det är alltid bolagsordningen som avgör skillnaden.",
            "Enligt aktiebolagslagen får ingen aktie ha mer än tio gånger så högt röstvärde som en annan aktie i samma bolag.",
            "Två aktieslag i samma företag kan handlas till olika priser. Skillnaden kan bland annat bero på:",
          ],
          bullets: [
            "rösträtten",
            "hur många aktier som finns",
            "hur stor handeln är",
            "utbud och efterfrågan",
          ],
          paragraphsAfterLists: [
            "Det går därför inte att utgå från att aktien med lägst styckpris automatiskt är det bästa valet.",
          ],
        },
        {
          subheading: "Stamaktier och preferensaktier",
          paragraphs: [
            "Stamaktier är den vanligaste typen av aktie.",
            "Preferensaktier kan ha särskilda ekonomiska rättigheter, exempelvis företräde till en viss utdelning framför stamaktierna.",
            "Preferensaktier fungerar däremot inte som ett sparkonto och utdelningen är inte garanterad. Villkoren varierar mellan bolagen och måste granskas separat.",
          ],
        },
        {
          subheading: "C-aktier, D-aktier och andra beteckningar",
          paragraphs: [
            "Vissa företag använder även beteckningar som C- eller D-aktier.",
            "Bokstaven i sig berättar inte exakt vilka villkor aktien har. Den kan avse exempelvis:",
          ],
          bullets: [
            "röstvärde",
            "rätt till utdelning",
            "omvandlingsmöjligheter",
            "andra särskilda rättigheter",
          ],
          paragraphsAfterLists: [
            "Läs därför alltid företagets information och bolagsordning i stället för att dra slutsatser enbart utifrån aktiens bokstav.",
          ],
        },
      ],
    },
    {
      heading: "Hur bestäms priset på en aktie?",
      paragraphs: [
        "Aktiekursen är det pris där en köpare och en säljare genomför en affär.",
        "På marknaden finns investerare som vill köpa till vissa priser och andra som vill sälja till vissa priser. Orderna samlas i en orderbok.",
        "När en köporder kan matchas med en säljorder sker ett avslut. Det senast genomförda avslutet visas ofta som aktiens aktuella kurs.",
        "På kort sikt påverkas priset av utbud och efterfrågan. På längre sikt försöker marknaden bedöma hur mycket företagets framtida vinster, kassaflöden och tillgångar är värda.",
        "Eftersom framtiden är osäker påverkas värderingen bland annat av:",
      ],
      bullets: [
        "konjunkturen",
        "räntor",
        "inflation",
        "valutor",
        "politiska beslut",
        "konkurrens",
        "bolagets resultat",
        "marknadens förväntningar",
      ],
    },
    {
      heading: "Vad kan få en aktiekurs att stiga eller falla?",
      paragraphs: [
        "Aktiekursen kan påverkas av många saker samtidigt:",
      ],
      bullets: [
        "företagets resultat och försäljning",
        "framtidsprognoser",
        "nya finansiella mål",
        "produktlanseringar och investeringar",
        "företagsförvärv",
        "förändringar i ledning eller styrelse",
        "konkurrens och branschutveckling",
        "räntor, inflation och konjunktur",
        "politiska beslut och regler",
        "valutor och råvarupriser",
        "marknadens riskvilja",
      ],
      paragraphsAfterLists: [
        "Det avgörande är ofta inte bara om en nyhet är positiv eller negativ, utan hur den förhåller sig till marknadens förväntningar.",
        "Ett företag kan exempelvis redovisa högre vinst än föregående år men ändå få en fallande aktiekurs om investerarna hade räknat med ett ännu bättre resultat.",
        "Ett bra företag är därför inte automatiskt en bra investering till vilket pris som helst. Priset behöver sättas i relation till bolagets ekonomi, framtidsutsikter och risker.",
      ],
    },
    {
      heading: "Aktiekurs är inte samma sak som bolagets värde",
      paragraphs: [
        "En aktie som kostar 20 kronor är inte automatiskt billigare än en aktie som kostar 500 kronor.",
        "Styckpriset säger inte tillräckligt mycket utan information om hur många aktier bolaget har gett ut.",
        "Bolagets börsvärde beräknas förenklat som:",
      ],
      calculation: {
        title: "Börsvärde",
        lines: [
          "aktiekurs × antal utestående aktier",
          "Ett företag med en miljard aktier som kostar 20 kronor styck har ett börsvärde på 20 miljarder kronor.",
          "Ett annat företag med tio miljoner aktier som kostar 500 kronor styck har ett börsvärde på 5 miljarder kronor.",
        ],
      },
      paragraphsAfterLists: [
        "Trots det högre priset per aktie är det andra företaget alltså mindre värderat av marknaden.",
        "Samma princip förklarar varför en aktiesplit inte i sig skapar värde. Vid en split delas varje befintlig aktie upp i flera aktier. Antalet aktier ökar och priset per aktie minskar proportionellt, medan ägarens sammanlagda andel av bolaget i utgångsläget är oförändrad.",
      ],
    },
    {
      heading: "Hur kan en aktie ge avkastning?",
      paragraphs: [
        "Avkastningen från en aktie brukar delas upp i två delar.",
      ],
      subsections: [
        {
          subheading: "Kursutveckling",
          paragraphs: [
            "Om du köper en aktie för 100 kronor och senare säljer den för 130 kronor har du fått en kursvinst på 30 kronor före avgifter och skatt.",
            "Om kursen i stället faller till 70 kronor har aktien minskat med 30 kronor i värde.",
            "Förlusten är orealiserad så länge aktien inte har sålts, men värdet på innehavet har ändå minskat.",
          ],
        },
        {
          subheading: "Utdelning",
          paragraphs: [
            "Om företaget betalar utdelning får aktieägarna ett visst belopp per aktie.",
            "Äger du 100 aktier och utdelningen är 5 kronor per aktie får du 500 kronor före eventuell skatt.",
            "Den totala avkastningen består av kursförändringen och mottagna utdelningar, med hänsyn till kostnader och skatt.",
            "Ett vanligt misstag är att bara titta på direktavkastningen. En hög direktavkastning kan bero på att aktiekursen har fallit eftersom marknaden befarar att företagets vinst eller utdelning inte är hållbar.",
          ],
        },
      ],
    },
    {
      heading: "Vilka risker finns med aktier?",
      paragraphs: [
        "Aktier kan ge avkastning, men det finns ingen garanti för att så sker. Du kan förlora delar av eller hela det investerade kapitalet.",
      ],
      subsections: [
        {
          subheading: "Företagsspecifik risk",
          paragraphs: [
            "Det enskilda företaget kan drabbas av exempelvis:",
          ],
          bullets: [
            "minskad försäljning",
            "högre kostnader",
            "för stor skuldsättning",
            "konkurrensproblem",
            "rättsliga tvister",
            "svaga förvärv",
            "dålig ledning",
          ],
          paragraphsAfterLists: [
            "I värsta fall kan företaget gå i konkurs. Aktieägarna står då långt bak i kön efter att företagets skulder har hanterats, och aktierna kan bli värdelösa.",
          ],
        },
        {
          subheading: "Marknadsrisk",
          paragraphs: [
            "Även välskötta företag kan falla när hela börsen går ned.",
            "Räntor, recession, krig, finansiell oro och förändrad riskvilja kan pressa stora delar av marknaden samtidigt.",
            "Marknadsrisken kan inte tas bort helt genom att äga fler aktier eftersom många företag påverkas av samma ekonomiska faktorer.",
          ],
        },
        {
          subheading: "Koncentrationsrisk",
          paragraphs: [
            "Om en stor del av ditt kapital ligger i ett enda företag blir resultatet starkt beroende av just det bolaget.",
            "Samma problem kan uppstå om alla innehav finns i samma bransch eller land.",
            "Riskspridning mellan flera företag, branscher och marknader minskar beroendet av en enskild investering. Riskspridning tar däremot inte bort risken för förlust.",
          ],
        },
        {
          subheading: "Likviditetsrisk",
          paragraphs: [
            "Likviditet beskriver hur lätt en aktie kan köpas eller säljas utan att priset påverkas kraftigt.",
            "I en aktie med låg omsättning kan avståndet mellan bästa köp- och säljpris vara stort. Det kan också saknas tillräckligt många köpare när du vill sälja.",
            "Risken är ofta större i små eller onoterade företag.",
          ],
        },
        {
          subheading: "Valutarisk",
          paragraphs: [
            "När du köper en utländsk aktie påverkas värdet i svenska kronor både av aktiens utveckling och valutakursen.",
            "En stigande aktiekurs i lokal valuta kan delvis eller helt motverkas om den svenska kronan stärks mot den aktuella valutan.",
            "Utländsk handel kan även medföra:",
          ],
          bullets: [
            "växlingsavgifter",
            "andra courtagemodeller",
            "utländsk källskatt på utdelningar",
          ],
          paragraphsAfterLists: [
            "De exakta konsekvenserna beror på marknad och kontotyp.",
          ],
        },
      ],
    },
    {
      heading: "Hur köper och säljer man aktier?",
      paragraphs: [
        "För att handla börsnoterade aktier behöver du normalt ett konto hos en bank eller ett värdepappersbolag.",
        "Du söker upp aktien, väljer antal och lämnar en köp- eller säljorder.",
        "En affär kan bara genomföras om det finns en motpart. Vill du köpa måste någon vara beredd att sälja, och vill du sälja måste någon vilja köpa.",
      ],
      subsections: [
        {
          subheading: "Limitorder",
          paragraphs: [
            "Med en limitorder anger du:",
          ],
          bullets: [
            "det högsta pris du är beredd att betala vid köp",
            "eller det lägsta pris du accepterar vid försäljning",
          ],
          paragraphsAfterLists: [
            "En köporder med limit 100 kronor ska alltså inte genomföras till ett högre pris än 100 kronor.",
            "Det finns däremot ingen garanti för att ordern genomförs. Om ingen vill sälja till ditt pris kan ordern ligga kvar eller förfalla.",
          ],
        },
        {
          subheading: "Order utan angiven prisgräns",
          paragraphs: [
            "En order utan en bestämd prisgräns försöker genomföras mot de bästa tillgängliga priserna.",
            "I stora och likvida aktier kan avslutet ske nära den kurs som visas. I en aktie med låg omsättning kan priset däremot bli sämre än väntat.",
            "Det är därför viktigt att förstå bankens ordertyper och villkor innan en order skickas.",
          ],
        },
        {
          subheading: "Courtage och andra kostnader",
          paragraphs: [
            "Banken eller värdepappersbolaget kan ta ut courtage när en order genomförs.",
            "Courtaget kan vara:",
          ],
          bullets: [
            "en procentuell avgift",
            "ett fast minimibelopp",
            "eller en kombination",
          ],
          paragraphsAfterLists: [
            "Utländsk handel kan även bli dyrare genom valutaväxling och fler mellanhänder.",
            "Små avgifter kan få stor betydelse om du gör många små affärer. Ett minimicourtage blir procentuellt dyrt när orderbeloppet är lågt.",
          ],
        },
      ],
    },
    {
      heading: "Vilket konto kan aktierna ligga på?",
      paragraphs: [
        "Svenska privatsparare använder framför allt:",
      ],
      bullets: [
        "investeringssparkonto, ISK",
        "kapitalförsäkring, KF",
        "aktie- och fondkonto, även kallat depå",
      ],
      paragraphsAfterLists: [
        "Skattereglerna skiljer sig mellan kontoformerna.",
        "På ett ISK sker beskattningen genom schablonregler i stället för att varje enskild vinst eller förlust deklareras separat.",
        "På en vanlig depå behöver försäljningar normalt redovisas och vinst eller förlust räknas fram utifrån försäljningspris och omkostnadsbelopp.",
        "Kontovalet påverkar hur sparandet beskattas och administreras. Det förändrar däremot inte den ekonomiska risken i själva aktien.",
        "Eftersom svenska skatteregler kan ändras behandlas kontoformer och aktuell beskattning mer utförligt i en separat DivLab-guide.",
      ],
    },
    {
      heading: "Vanliga misstag när man börjar med aktier",
      subsections: [
        {
          subheading: "Att köpa på ett tips utan egen kontroll",
          paragraphs: [
            "Sociala medier, forum och bekanta kan ge idéer, men de bör inte ersätta egen granskning.",
            "Den som tipsar kan:",
          ],
          bullets: [
            "ha andra mål",
            "redan äga aktien",
            "vilja sälja",
            "sakna viktig information",
            "underskatta riskerna",
          ],
          paragraphsAfterLists: [
            "Var källkritisk och kontrollera informationen direkt hos företaget och andra trovärdiga källor.",
          ],
        },
        {
          subheading: "Att blanda ihop låg aktiekurs med låg värdering",
          paragraphs: [
            "En aktie för 10 kronor kan vara högre värderad än en aktie för 500 kronor.",
            "Antalet aktier, skulderna, vinsten och framtidsutsikterna spelar större roll än styckpriset.",
          ],
        },
        {
          subheading: "Att lägga för mycket i ett enda bolag",
          paragraphs: [
            "En koncentrerad investering kan utvecklas starkt om bolaget lyckas, men också ge stora förluster om något går fel.",
            "Riskspridning minskar beroendet av en enskild investering.",
          ],
        },
        {
          subheading: "Att bara fokusera på utdelning",
          paragraphs: [
            "Utdelning är en del av totalavkastningen, inte hela bilden.",
            "En hög direktavkastning kompenserar inte automatiskt för ett företag vars verksamhet, ekonomi och aktiekurs försämras.",
          ],
        },
        {
          subheading: "Att handla för ofta",
          paragraphs: [
            "Varje affär kan medföra:",
          ],
          bullets: [
            "courtage",
            "skillnad mellan köp- och säljpris",
            "valutaväxling",
            "skattekonsekvenser beroende på kontoform",
          ],
          paragraphsAfterLists: [
            "Tät handel ökar även risken att kortsiktiga känslor styr besluten.",
          ],
        },
        {
          subheading: "Att investera pengar som snart behövs",
          paragraphs: [
            "Aktiemarknaden kan falla kraftigt och en återhämtning kan ta tid.",
            "Pengar som behövs till löpande utgifter eller nära förestående inköp bör därför inte vara beroende av att en aktie kan säljas vid en viss tidpunkt och till ett visst pris.",
          ],
        },
      ],
    },
    {
      heading: "Hur hittar man information om ett företag?",
      paragraphs: [
        "Börja med företagets egen investerarsida.",
        "Där publiceras vanligtvis:",
      ],
      bullets: [
        "årsredovisningar",
        "delårsrapporter",
        "pressmeddelanden",
        "finansiella mål",
        "presentationer",
        "information om bolagsstämma",
        "uppgifter om styrelse och ledning",
      ],
      paragraphsAfterLists: [
        "Läs inte bara resultaträkningen. Balansräkning och kassaflödesanalys kan ge viktig information om företagets skulder, kapitalbehov och faktiska betalningsflöden.",
      ],
      subsections: [
        {
          subheading: "Komplettera företagets egen information med:",
          bullets: [
            "marknadsplatsens information",
            "myndighetskällor",
            "flera oberoende källor",
          ],
          paragraphsAfterLists: [
            "Ett enskilt nyckeltal eller positivt pressmeddelande ger sällan en fullständig bild.",
          ],
        },
      ],
    },
    {
      heading: "Är aktier rätt för alla?",
      paragraphs: [
        "Aktier kan vara ett sätt att ta del av företags värdeutveckling, men de passar inte alla pengar eller alla situationer.",
        "Det centrala är:",
      ],
      bullets: [
        "hur stor värdeminskning du kan hantera",
        "när pengarna ska användas",
        "hur beroende du är av kapitalet",
        "hur väl du förstår investeringen",
      ],
      paragraphsAfterLists: [
        "En person som behöver pengarna inom kort har mindre möjlighet att vänta ut en börsnedgång än någon som inte behöver kapitalet under lång tid.",
      ],
      subsections: [
        {
          subheading: "Finansinspektionens grundläggande konsumentbudskap är att:",
          bullets: [
            "bara investera i sådant du förstår",
            "sprida riskerna",
            "vara källkritisk",
            "inte använda pengar du inte har råd att förlora",
          ],
          paragraphsAfterLists: [
            "För många kan breda aktiefonder vara ett enklare sätt att få exponering mot flera företag än att själva välja enskilda aktier.",
            "En aktiefond innebär fortfarande marknadsrisk, men minskar beroendet av hur ett enda företag utvecklas.",
          ],
        },
      ],
    },
    {
      heading: "Vanliga frågor om aktier",
      subsections: [
        {
          subheading: "Är en aktie samma sak som en del av företaget?",
          paragraphs: [
            "Ja. En aktie är en ägarandel i ett aktiebolag. Hur stor andel du äger beror på antalet aktier du äger i förhållande till det totala antalet aktier.",
          ],
        },
        {
          subheading: "Kan man köpa bara en aktie?",
          paragraphs: [
            "Ja. På den svenska marknaden går det normalt att köpa en enskild aktie. Tänk samtidigt på att avgifter kan bli procentuellt höga om orderbeloppet är mycket litet.",
          ],
        },
        {
          subheading: "Betalar alla aktier utdelning?",
          paragraphs: [
            "Nej. Vissa företag återinvesterar kapitalet i verksamheten, andra saknar utrymme för utdelning och bolagsstämman kan besluta att ingen utdelning ska lämnas.",
          ],
        },
        {
          subheading: "Kan hela insatsen förloras?",
          paragraphs: [
            "Ja. En aktie kan i värsta fall bli värdelös.",
          ],
        },
        {
          subheading: "Är A-aktier alltid bättre än B-aktier?",
          paragraphs: [
            "Nej. Aktieslagen kan skilja sig i rösträtt, ekonomiska rättigheter, pris och handelsvolym. De exakta villkoren framgår av företagets bolagsordning.",
          ],
        },
        {
          subheading: "Varför faller en aktie efter utdelning?",
          paragraphs: [
            "När aktien handlas utan rätt till den beslutade utdelningen har motsvarande kapital lämnat eller ska lämna företaget. Kursen påverkas därför ofta nedåt ungefär i linje med utdelningen, samtidigt som andra marknadsfaktorer också påverkar priset.",
          ],
        },
        {
          subheading: "Är en aktie med lågt styckpris mindre riskfylld?",
          paragraphs: [
            "Nej. Ett lågt pris per aktie säger inte i sig något om företagets totala värdering eller risk.",
          ],
        },
      ],
    },
    {
      heading: "Sammanfattning",
      paragraphs: [
        "En aktie är en ägarandel i ett aktiebolag.",
        "Genom att köpa aktier kan du få del av företagets framtida utveckling genom stigande aktiekurs och eventuell utdelning.",
        "Som aktieägare kan du även få rösträtt och andra rättigheter, men villkoren kan variera mellan olika aktieslag och företag.",
        "Utdelning är inte garanterad. Aktiekurser kan falla kraftigt och hela det investerade kapitalet kan gå förlorat.",
        "Förstå därför:",
      ],
      bullets: [
        "vad företaget gör",
        "varför du köper aktien",
        "hur bolaget är värderat",
        "vilka risker som finns",
        "vilka kostnader handeln medför",
      ],
      paragraphsAfterLists: [
        "En aktie är enkel att köpa. Att bedöma om priset är rimligt och risken acceptabel kräver betydligt mer kunskap.",
      ],
    },
  ],
};

export default article;
