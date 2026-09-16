import type { NewsArticle } from "@/types/news";

/**
 * Bolaget i fokus — Svolder, 16 september 2026.
 * Editorial research cutoff: 11:08 CEST, 16 september 2026.
 * Separat faktakontroll: Svolders bokslutskommuniké 2025/2026 och aktuell
 * handel korsverifierades mot bolagets IR/MFN och etablerad marknadsrapportering.
 * P0_FACT_GATE=PASS.
 *
 * Duplicate/new-angle control: dagens BörsSverige nämnde Svolder endast efter
 * morgonens cutoff; denna artikel bygger på den senare publicerade rapporten och
 * går på djupet i helårsutfall, utdelning, portföljbidrag och substansrabatt.
 *
 * Managed Autoredaktion v1.1 initial publication intentionally omits image fields.
 * GitHub owns deterministic image preparation and validation.
 */
export const BOLAGET_I_FOKUS_SVOLDER_16_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "bolaget-i-fokus-svolder-16-september-2026",
  slug: "bolaget-i-fokus-svolder-16-september-2026",
  title: "Bolaget i fokus: Svolder slår småbolagsindex och höjer utdelningen",
  summary: "Svolder ökade substansvärdet med 7,3 procent under verksamhetsåret, slog sitt jämförelseindex och föreslår en utdelning på 1,92 kronor per aktie. Aktien handlas samtidigt under det senast rapporterade substansvärdet.",
  category: "company",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-16T11:10:00+02:00",
  url: "/news/bolaget-i-fokus-svolder-16-september-2026",
  featured: true,
  imageUrl: "/news/generated/bolaget-i-fokus-2026-09-16.png",
  thumbnailImageUrl: "/news/generated/bolaget-i-fokus-2026-09-16.png",
  imageAlt: "Bolaget i fokus 2026-09-16 – DivLabs artikel om dagens mest intressanta bolagshändelse.",
  readingMinutes: 4,
  seoTitle: "Svolder aktie: slår index och höjer utdelningen 2026",
  seoDescription: "Svolder slår småbolagsindex 2025/2026, redovisar 408 Mkr i resultat och föreslår höjd utdelning till 1,92 kronor per aktie.",
  seoKeywords: ["Svolder", "Svolder aktie", "Svolder rapport 2026", "Svolder utdelning 2026", "Svolder substansvärde", "SVOL B", "investmentbolag småbolag", "Bolaget i fokus", "16 september 2026"],
  internalLinking: { topics: ["investmentbolag", "svenska småbolag", "utdelning", "substansvärde"], companies: ["Svolder"], tickers: ["SVOL B"], relatedNewsSlugs: ["borssverige-16-september-2026"] },
  showDisclaimer: true,
  intro: [
    "Investmentbolaget Svolder avslutar verksamhetsåret 2025/2026 med ett tydligt bättre utfall än sitt svenska småbolagsindex. Substansvärdet steg med 7,3 procent inklusive återinvesterad utdelning, medan Carnegie Small Cap Return Index ökade med 4,4 procent. Styrelsen föreslår samtidigt att utdelningen höjs till 1,92 kronor per aktie från 1,80 kronor.",
    "Rapporten är dagens tydligaste nya bolagsvinkel efter morgonens BörsSverige. Där hann Svolder inte ingå i researchen före börsöppningen. Nu finns både helårsrapporten och faktisk handel att bedöma, vilket gör det möjligt att gå djupare i vad som drev resultatet och hur aktien värderas mot substansen."
  ],
  sections: [
    { heading: "Svolder slog index under både kvartalet och helåret", paragraphs: ["Under det fjärde kvartalet, juni till augusti, ökade Svolders substansvärde inklusive återinvesterad utdelning med 7,0 procent till 59,40 kronor per aktie. Jämförelseindexet Carnegie Small Cap Return Index steg samtidigt med 3,2 procent. B-aktiens totalavkastning var 7,2 procent under kvartalet.", "För hela verksamhetsåret 1 september 2025 till 31 augusti 2026 steg substansvärdet med 7,3 procent inklusive återinvesterad utdelning. B-aktien ökade med 10,3 procent på samma sätt räknat, medan jämförelseindex steg 4,4 procent. Det innebär att både portföljen och aktien utvecklades bättre än småbolagsindex under året.", "Det redovisade resultatet för helåret blev 408 miljoner kronor, jämfört med 9 miljoner kronor föregående verksamhetsår. Resultatet motsvarade 4,00 kronor per aktie, mot 0,10 kronor året före. För en investmentbolagsrapport är förändringen i substansvärdet viktigare än traditionell omsättning, eftersom värdeutvecklingen i aktieportföljen är kärnan i verksamheten."] },
    { heading: "FM Mattsson, Troax och Tången drev kvartalet", paragraphs: ["Svolder pekar ut FM Mattsson, Troax och Tången Industrikapital som de största positiva bidragsgivarna till substansvärdet under det fjärde kvartalet. New Wave och GARO stod för de största negativa bidragen.", "Portföljen förändrades också. Svolder ökade bland annat innehaven i Tången Industrikapital, VBG och Beijer Alma, medan innehaven i MilDef, Platzer och Scandic Hotels minskades. Förändringarna visar hur förvaltningen successivt flyttar kapital mellan svenska småbolag snarare än att följa ett statiskt index.", "Det gör rapporten intressant även bortom själva resultatet. Ett investmentbolags substansvärde påverkas direkt av hur de underliggande innehaven utvecklas, och Svolders överavkastning under året visar att portföljvalen sammantaget gav mer än jämförelseindex."] },
    { heading: "Utdelningen föreslås höjas till 1,92 kronor", paragraphs: ["Styrelsen föreslår en utdelning på 1,92 kronor per aktie för verksamhetsåret, upp från 1,80 kronor. Det motsvarar totalt cirka 197 miljoner kronor enligt rapporten. Under det fjärde kvartalet betalades 0,45 kronor per aktie ut inom den nuvarande kvartalsvisa utdelningsmodellen.", "Den föreslagna höjningen är 0,12 kronor per aktie, motsvarande cirka 6,7 procent. För utdelningsinriktade ägare är det ett konkret besked, men den slutliga utdelningen kräver beslut på årsstämman.", "Svolder har sin nästa ordinarie bolagsstämma senare under hösten. Fram till dess är 1,92 kronor ett styrelseförslag och ska inte beskrivas som redan beslutad utdelning."] },
    { heading: "Aktien handlas under det rapporterade substansvärdet", paragraphs: ["Efter rapportperiodens slut uppgav Svolder att substansvärdet den 11 september var 59 kronor per aktie och att B-aktien stod i 57,75 kronor. Det motsvarade en rabatt på drygt 2 procent mot det rapporterade substansvärdet vid samma tidpunkt.", "I onsdagens handel var B-aktien upp omkring 1,7 procent under förmiddagen enligt marknadsrapporteringen. Rörelsen är positiv men inte tillräckligt stor för att beskrivas som en rusning. Den viktiga värderingsfrågan är i stället om aktien framöver ska handlas med rabatt eller premie mot portföljens löpande substansvärde.", "Svolder offentliggör substansvärdet regelbundet. Därför får investerare en relativt tydlig referenspunkt för hur börskursen värderar förvaltningen och de underliggande svenska småbolagen."] },
    { heading: "Det här blir viktigt härnäst", paragraphs: ["Efter ett år där Svolder slagit småbolagsindex blir nästa fråga om överavkastningen kan fortsätta när ett nytt verksamhetsår nu har börjat. Portföljens utveckling i bland annat Tången Industrikapital, VBG och Beijer Alma blir viktig, liksom om de svagare bidragen från New Wave och GARO vänder.", "Årsredovisningen väntas senare under hösten och årsstämman ska därefter ta ställning till utdelningsförslaget. Samtidigt fortsätter det veckovisa substansvärdet att ge en löpande bild av hur portföljen utvecklas efter rapportdatumet.", "Dagens rapport ger därför två tydliga besked: Svolder avslutade 2025/2026 bättre än sitt jämförelseindex och styrelsen vill höja utdelningen. Om det räcker för en varaktigt högre värdering av Svolder-aktien avgörs av hur portföljen utvecklas under det nya verksamhetsåret."] }
  ],
  sources: [
    { text: "Svolder: Bokslutskommuniké 2025/2026, 16 september 2026", href: "https://mfn.se/a/svolder/svolders-bokslutskommunike-2025-2026" },
    { text: "Svolder: Investor relations och finansiell kalender", href: "https://svolder.se/investor-relations/" },
    { text: "Placera: Svolder ökade substansvärdet och höjer utdelningen", href: "https://www.placera.se/nyheter/svolder-okade-substansvardet-och-hojer-utdelningen-2026-09-16" },
    { text: "Placera: Stockholmsbörsens öppning 16 september 2026", href: "https://www.placera.se/nyheter/assa-abloy-stiger-efter-forvarv--stockholmsborsen-inleder-uppat-2026-09-16" }
  ]
};
