import type { NewsArticle } from "@/types/news";

/**
 * Nvidia earnings preview / AI rally — 25 August 2026.
 *
 * Editorial cutoff: approximately 14:20 Europe/Stockholm, before the US cash-market open.
 * Verified editorial sources:
 * - NVIDIA Q1 FY2027 results, 20 May 2026: revenue $81.6bn, Data Center $75.2bn,
 *   Q2 revenue outlook $91.0bn +/-2%, non-GAAP gross margin 75.0% +/-50 bps,
 *   and no Data Center compute revenue from China assumed in the Q2 outlook.
 * - NVIDIA Investor Relations, 29 Jul 2026: Q2 FY2027 results scheduled for 26 Aug;
 *   results expected around 13:20 PT and conference call at 14:00 PT.
 * - NVIDIA Newsroom, 31 May 2026: Vera Rubin ramping into full production.
 * - Reuters/LSEG, 25 Aug 2026: analyst consensus around $92.18bn Q2 revenue and
 *   around $104.20bn Q3 revenue; Big Tech data-center capex expected to exceed $730bn in 2026.
 * - Reuters, 25 Aug 2026: options imply roughly a 5.4% move after earnings,
 *   equivalent to about $280bn in market value.
 * - Reuters, 24–25 Aug 2026: Nvidia fell 2.9% Monday, its seventh straight down day;
 *   the stock and several chip names rebounded in early Tuesday premarket trading.
 *
 * Cover uploaded by the editor:
 * public/news-demo/file_00000000d95881f4a0a3a5d8d754ad4e.png
 */
export const NVIDIA_INFOR_ODESRAPPORTEN_AI_RALLY_25_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "nvidia-infor-odesrapporten-ai-rally-25-augusti-2026",
  slug: "nvidia-infor-odesrapporten-ai-rally-25-augusti-2026",
  title: "Nvidia inför ödesrapporten – det här talar för och emot nästa AI-rally",
  summary:
    "Nvidia rapporterar på onsdag med extremt höga förväntningar. Stark AI-efterfrågan, Rubin och fortsatt miljardcapex talar för – men värderingar, konkurrens och en ribba runt 104 miljarder dollar för nästa kvartal gör rapporten ovanligt känslig.",
  category: "company",
  source: "DivLab",
  publishedAt: "2026-08-25T14:20:00+02:00",
  url: "/news/nvidia-infor-odesrapporten-ai-rally-25-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_00000000d95881f4a0a3a5d8d754ad4e.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  mobileHeadlineFirst: true,
  imageAlt:
    "DivLab-omslag med ett Nvidia-chip i en datacentermiljö inför bolagets Q2-rapport den 26 augusti 2026.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle: "Nvidia inför rapporten – det talar för och emot nästa AI-rally",
  seoDescription:
    "Nvidia rapporterar Q2 den 26 augusti. DivLab går igenom förväntningarna, Rubin, AI-investeringarna och riskerna som kan avgöra nästa rörelse i AI-aktier.",
  seoKeywords: [
    "Nvidia",
    "Nvidia rapport",
    "Nvidia Q2 2026",
    "Nvidia aktie",
    "NVDA",
    "AI aktier",
    "AI-rally",
    "Vera Rubin",
    "Blackwell",
    "datacenter",
    "halvledare",
    "Wall Street",
    "börsnyheter",
  ],
  internalLinking: {
    topics: ["AI", "halvledare", "datacenter", "Q2 2026", "Wall Street"],
    companies: ["Nvidia", "AMD", "Microsoft", "Amazon", "Meta", "Google"],
    tickers: ["NVDA", "AMD", "MSFT", "AMZN", "META", "GOOGL"],
    relatedNewsSlugs: [
      "ai-handeln-pressas-wall-street-nvidia-24-augusti-2026",
      "borsveckan-24-28-augusti-2026-nvidia-jackson-hole",
      "ai-frossa-wall-street-chipjattar-19-augusti-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Nvidia rapporterar efter Wall Streets stängning på onsdag och förväntningarna är extrema. Analytiker räknar med en omsättning på omkring 92 miljarder dollar – nästan dubbelt så mycket som samma kvartal förra året.",
    "Men marknadens viktigaste fråga är inte längre bara hur mycket Nvidia säljer. Den handlar om hur länge den enorma AI-investeringstakten kan fortsätta och om nästa generations Rubin-plattform kan bära tillväxten vidare.",
    "Rapporten blir därför ett test långt utanför Nvidia. Ett starkt besked kan ge nytt bränsle åt halvledare, datacenter och andra AI-aktier, medan en försiktig guidning kan förstärka den oro som pressat sektorn de senaste dagarna.",
  ],
  sections: [
    {
      heading: "AI-aktierna pressades inför rapporten",
      paragraphs: [
        "Nvidia föll 2,9 procent på måndagen och noterade sin sjunde raka handelsdag på minus. Micron tappade samtidigt 5,8 procent och Broadcom 2,6 procent, medan Nasdaq Composite stängde 0,76 procent lägre.",
        "I Reuters tidiga förhandelsmätning på tisdagen syntes däremot en rekyl. Nvidia var då upp 1,33 procent, Micron steg 2,75 procent och Nasdaq 100-terminen låg 0,85 procent högre.",
        "Det betyder inte att oron kring AI-handeln är borta. Snarare visar rörelsen hur känsligt läget är när en av marknadens viktigaste AI-aktier står inför en rapport som kan påverka hela sektorn.",
      ],
    },
    {
      heading: "92 miljarder dollar kan ändå vara för lite",
      paragraphs: [
        "Nvidia redovisade i Q1 rekordintäkter på 81,6 miljarder dollar, en ökning med 85 procent från året före. Datacenterverksamheten stod för 75,2 miljarder dollar och växte 92 procent.",
        "Inför Q2 har Nvidia själv guidat för 91 miljarder dollar i omsättning, plus eller minus 2 procent, och omkring 75 procent justerad bruttomarginal. Bolaget räknade samtidigt inte med några intäkter från datacenterberäkningar i Kina i prognosen.",
        "Analytikerkonsensus från LSEG ligger runt 92,18 miljarder dollar. Ännu viktigare är nästa kvartal: marknaden väntar sig omkring 104,20 miljarder dollar i Q3-omsättning, vilket skulle motsvara en tillväxt på drygt 82 procent från året före.",
        "Det är rapportens centrala konflikt. Nvidia kan leverera siffror som vore exceptionella för nästan vilket annat bolag som helst och ändå få en svag kursreaktion om guidningen inte överträffar de redan mycket höga förväntningarna.",
      ],
    },
    {
      heading: "Det som talar för nästa AI-rally",
      paragraphs: [
        "Det starkaste argumentet för Nvidia är fortfarande kundernas investeringsvilja. Big Techs samlade investeringar i datacenter och annan infrastruktur väntas enligt Reuters överstiga 730 miljarder dollar under 2026. Nvidia befinner sig mitt i den investeringsvågen.",
        "Nästa stora produktsteg är Vera Rubin. Nvidia uppgav i maj att plattformen rampas upp i full produktion, med system som byggs av stora server- och molnaktörer. Om övergången från Blackwell till Rubin går enligt plan och efterfrågan är stark kan det ge marknaden stöd för att tillväxten har ytterligare ett ben.",
        "Rubin är dessutom mer än en enskild GPU. Plattformen kombinerar processorer, nätverk och annan datacenterteknik, vilket gör att Nvidia försöker ta en större del av värdet i nästa generations AI-fabriker.",
        "Kina kan också bli en framtida möjlighet. Eftersom Nvidias Q2-prognos inte räknade med datacenterintäkter från Kina blir varje tydlig förbättring i möjligheten att sälja avancerade chip där en potentiell uppsida framåt, även om exportrestriktionerna fortsatt gör marknaden osäker.",
      ],
    },
    {
      heading: "Det som talar emot aktien",
      paragraphs: [
        "Den största risken är förväntningarna. När marknaden redan räknar med närmast fördubblad kvartalsomsättning krävs det mer än en vanlig prognosöverträffning för att skapa en ny positiv överraskning.",
        "Samtidigt granskas hållbarheten i AI-investeringarna hårdare. Nvidia har tillsammans med stora finansaktörer varit med och byggt finansieringsplattformar som siktar på mer än 500 miljarder dollar till AI-infrastruktur. Bolaget har också åtagit sig en garanti på upp till 105 miljarder dollar kopplad till OpenAI:s planerade datacenter i Ohio. Uppläggen visar hur kapitalintensiv AI-utbyggnaden blivit.",
        "Konkurrensen ökar också. AMD försöker ta större marknadsandelar samtidigt som Google, Amazon, Microsoft och andra utvecklar eller använder egna specialiserade AI-chip. Det blir särskilt viktigt inom inference, alltså när färdigtränade modeller används i verkliga tjänster.",
        "Till sist måste lönsamheten hålla. En justerad bruttomarginal runt 75 procent är en central del av Nvidias nuvarande styrka. Om marginalen börjar pressas samtidigt som tillväxten mattas skulle marknaden få två negativa signaler på samma gång.",
      ],
    },
    {
      heading: "Fyra saker som kan avgöra rapporten",
      paragraphs: [
        "Först kommer Q2-omsättningen. Konsensus ligger omkring 92,2 miljarder dollar och en tydlig avvikelse därifrån blir den första signalen om hur stark efterfrågan varit.",
        "Därefter kommer Q3-guidningen. Runt 104,2 miljarder dollar är dagens marknadsförväntning och kan bli rapportens viktigaste siffra eftersom den säger mer om riktningen framåt än det redan avslutade kvartalet.",
        "Den tredje punkten är bruttomarginalen. Om Nvidia kan hålla omkring 75 procent samtidigt som nya system skalas upp stärker det bilden av fortsatt stark prissättningskraft.",
        "Den fjärde är kommentarerna om Rubin och de stora molnbolagens investeringar. Om Jensen Huang beskriver fortsatt accelererande efterfrågan får hela AI-sektorn stöd. Om kunderna låter mer försiktiga blir signalen den motsatta.",
      ],
    },
    {
      heading: "DivLabs scenarioanalys",
      paragraphs: [
        "Starkt positivt scenario: Nvidia slår Q2-förväntningarna tydligt, guidar över cirka 104 miljarder dollar för Q3 och bekräftar stark Rubin-efterfrågan med stabila marginaler. Det skulle stärka tesen att AI-investeringarna fortfarande överträffar marknadens höga krav.",
        "Blandat scenario: Q2 är starkt men Q3-guidningen hamnar ungefär vid konsensus. Verksamheten skulle då fortfarande vara exceptionellt stark, men marknaden kan bedöma att mycket av det positiva redan är inprisat.",
        "Negativt scenario: guidningen hamnar under förväntningarna eller marginalerna försvagas tydligt. Då ökar frågetecknen kring hur länge den extrema tillväxttakten kan fortsätta.",
        "Det tydligast negativa scenariot för hela AI-sektorn vore försiktigare kommentarer om kundernas investeringar tillsammans med problem i Rubin-upptrappningen. Det skulle kunna flytta fokus från en enskild Nvidia-rapport till hållbarheten i hela AI-investeringsboomen.",
        "Detta är DivLabs scenarioanalys och inte en prognos för hur Nvidia-aktien kommer att utvecklas.",
      ],
    },
    {
      heading: "Optionsmarknaden räknar med en enorm rörelse",
      paragraphs: [
        "Optionsmarknaden prissätter inför rapporten en rörelse på omkring 5,4 procent åt endera hållet i Nvidia-aktien. Det motsvarar ungefär 280 miljarder dollar i börsvärde, enligt Reuters.",
        "Den förväntade procentuella rörelsen är samtidigt lägre än inför rapporten i maj och under Nvidias genomsnittliga rapportreaktion de senaste tolv kvartalen. Marknaden räknar alltså med en enorm rörelse i dollar, men inte med en ovanligt stor Nvidia-rörelse i procent.",
        "Det är därför onsdagens rapport kan beskrivas som en ödesrapport för AI-handeln snarare än för Nvidias existens. Få andra bolag ger en lika tydlig temperaturmätare på efterfrågan på GPU:er, datacenter och den globala AI-utbyggnaden.",
        "Nvidia väntas offentliggöra resultatet onsdagen den 26 augusti omkring klockan 22.20 svensk tid. Telefonkonferensen börjar klockan 23.00. Då får marknaden veta om tillväxten fortfarande är tillräckligt stark för att lyfta förväntningarna ännu en gång – eller om fantastiska siffror inte längre är fantastiska nog.",
      ],
    },
  ],
  sources: [
    {
      text: "NVIDIA – Financial Results for First Quarter Fiscal 2027, 20 May 2026",
      href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-First-Quarter-Fiscal-2027/default.aspx",
    },
    {
      text: "NVIDIA – Conference Call for Second-Quarter Financial Results, 29 July 2026",
      href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Second-Quarter-Financial-Results/default.aspx",
    },
    {
      text: "NVIDIA – Vera Rubin Ramps Into Full Production, 31 May 2026",
      href: "https://nvidianews.nvidia.com/news/vera-rubin-full-production-agentic-ai-factory",
    },
    {
      text: "Reuters – Nvidia faces growth test as Rubin debut meets AI financing scrutiny, 25 August 2026",
      href: "https://www.reuters.com/business/retail-consumer/nvidia-faces-growth-test-rubin-debut-meets-ai-financing-scrutiny-2026-08-25/",
    },
    {
      text: "Reuters – Nvidia shares set for $280 billion price swing after earnings, 25 August 2026",
      href: "https://www.reuters.com/business/nvidia-shares-set-280-billion-price-swing-after-earnings-options-show-2026-08-25/",
    },
    {
      text: "Reuters – US stock futures rise on tech rebound before Nvidia results, 25 August 2026",
      href: "https://www.reuters.com/business/us-stock-futures-rise-tech-rebound-before-nvidia-inflation-tests-2026-08-25/",
    },
  ],
};
