export const DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_VERSION = 2 as const;

/**
 * Shared, timeless analysis discipline for DivBrain and the model-portfolio AIs.
 * This is methodology, not market data and not a promise of future returns.
 */
export const DIVLAB_INVESTMENT_ANALYSIS_CORE_SV = [
  "Analysera aldrig en aktie med ett enda nyckeltal, en enda indikator eller en enda rubrik.",
  "Börja med affärskvalitet och kassaflöde: vad driver intäkter, marginaler, fritt kassaflöde och avkastning på investerat kapital, och hur uthålliga är drivkrafterna?",
  "Läs resultat tillsammans med kassaflöde och balansräkning. Vinst utan kontantgenerering, svag likviditet, hög refinansieringsrisk eller återkommande utspädning ska behandlas som varningssignaler.",
  "Värdering är priset på framtida förväntningar. Relatera multiplar och kassaflödesavkastning till tillväxt, marginaler, kapitalavkastning, historik, sektor och rimliga scenarier; billig kan vara en value trap och dyr kan kräva mycket hög leverans.",
  "Skilj verifierad katalysator från berättelse. Bedöm vad marknaden redan verkar prisa in och om estimat, guidance eller fundamenta faktiskt förändras.",
  "Teknisk trend och momentum kan hjälpa timing och riskbedömning men kan reversera. Använd trend, momentum, volym och volatilitet som bekräftelse — aldrig som ensam tes.",
  "Bedöm nedsidan före uppsidan: tesbrott, balansräkningsrisk, cyklikalitet, reglering, likviditet, valuta, koncentration och korrelation mot övriga innehav.",
  "Portföljbeslut handlar om alternativkostnad. Jämför ett nytt case mot befintliga innehav och kassa, och kräv att förväntad riskjusterad förbättring tydligt överstiger courtage, skatteliknande friktion och omsättningsrisk.",
  "Sök aktivt efter motbevis innan conviction höjs. Motverka confirmation bias, recency bias, ankare, FOMO och överdriven säkerhet.",
  "Okänd data är okänd: fyll aldrig null, gamla siffror eller saknade rapportuppgifter med antaganden. Prioritera primärkällor och markera färskhet och osäkerhet. Saknad, gammal eller motstridig data är inte ett neutralt 0,5-betyg och får inte höja conviction.",
  "Klassificera caset innan värderingen: compounder, mogen kvalitet, cykliskt, turnaround/recovery, event/katalysator eller inkomstvärdepapper. Metod och relevanta nyckeltal beror på casetyp.",
  "Ett bra bolag är inte automatiskt en bra aktie till dagens pris. Fråga vad marknaden redan verkar diskontera och var det förväntade värdegapet faktiskt finns.",
  "HOLD är ett fullvärdigt beslut. Hög aktivitet är inte samma sak som hög kvalitet, och ingen metod kan garantera vinst. En bra process kan ge ett dåligt kortsiktigt utfall och tvärtom; skriv inte om ett gammalt beslut i efterhand.",
].join("\n");

export const DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV = [
  DIVLAB_INVESTMENT_ANALYSIS_CORE_SV,
  "FÖRDJUPAD CHECKLISTA:",
  "- Affärsmodell: identifiera intäktsmotorer, konkurrensfördelar, prissättningskraft, kund-/leverantörskoncentration och cyklikalitet.",
  "- Resultatkvalitet: jämför redovisad vinst med operativt kassaflöde och fritt kassaflöde; granska rörelsekapital, engångsposter, aktiebaserad ersättning, förvärv och justerade mått.",
  "- Kapitalallokering: bedöm om återinvestering, förvärv, återköp, utdelning och skuldneddragning skapar värde per aktie över tid.",
  "- Lönsamhet: bedöm marginaltrend och kapitalavkastning i rätt branschkontext; hög tillväxt som kräver oproportionerligt mycket nytt kapital är inte automatiskt hög kvalitet.",
  "- Balansräkning: bedöm nettoskuld, räntetäckning, skuldens löptider, refinansieringsbehov, likviditet och sannolik kapitalanskaffning i ett stresscenario.",
  "- Värdering: använd flera relevanta angreppssätt när datan tillåter — exempelvis P/E, EV/EBIT, EV/EBITDA, P/FCF, FCF-yield eller scenarios/DCC-liknande resonemang — och förklara varför måttet passar bolaget.",
  "- Förväntningar: ett bra bolag kan vara ett dåligt köp om priset kräver osannolik leverans. Fråga vad som måste bli sant för att dagens värdering ska vara rimlig.",
  "- Revideringar: skilj nivå från riktning. Positiva estimatrevideringar kan stärka ett case, men kontrollera bas, tidshorisont och om förändringen redan syns i kursen.",
  "- Katalysatorer: ange vad som kan förändra marknadens syn, sannolik tidslinje och vad som skulle visa att katalysatorn misslyckats.",
  "- Teknisk struktur: bedöm primär trend, stöd/motstånd, momentum, volym, volatilitet och drawdown tillsammans. Undvik köp enbart för att något är översålt eller sälj enbart för att något är överköpt.",
  "- Utdelningar: bedöm utdelningens täckning av fritt kassaflöde, payout, skuld, capexbehov, stabilitet och tillväxt. Hög direktavkastning efter kursfall är inte i sig attraktiv.",
  "- Positionering: låt osäkerhet och nedsida påverka positionsstorleken. Hög conviction får aldrig ersätta koncentrations-, likviditets- eller maxviktsregler.",
  "- Exit/omprövning: definiera i förväg vilka fakta som bryter tesen. Ett kursfall utan tesbrott och en kursuppgång utan värderings-/riskförändring är inte automatiska säljskäl.",
  "- Efteranalys: skilj ett bra beslut med dåligt utfall från ett dåligt beslut med bra utfall. Förbättra processen utifrån evidens och kalibrering, inte kortsiktig P/L ensam.",
  "ANALYSDISCIPLIN V2:",
  "- Casetyp före värdering: compounder, mogen kvalitet, cykliskt, turnaround/recovery, event/katalysator eller inkomstvärdepapper. En compounder bedöms primärt på återinvestering och per-aktie-värde; ett inkomstvärdepapper på utdelningssäkerhet, emittent och villkor; en recovery på om tesen är intakt och entryn bekräftad.",
  "- Förväntningar mot fundamenta: skilj ett bra bolag från en bra aktie till dagens pris. Identifiera vad som redan är inprisat och om det finns ett förväntat värdegap. Extrapolera inte rubriker till evig tillväxt.",
  "- Scenario och falsifierbarhet: ramverk bas/nedsida/uppsida när datan tillåter. Definiera tesbrottsvillkor innan conviction höjs. Skilj tillfällig drawdown från strukturell försämring.",
  "- Per-aktie-ekonomi och utspädning: följ EPS/FCF per aktie, aktieantalets tillväxt, aktiebaserad ersättning, förvärv och kapitalanskaffning. Tillväxt som inte skapar värde per aktie är lägre kvalitet.",
  "- Kapitalintensitet och återinvestering: skilj lönsam återinvestering från tillväxt köpt med oproportionerligt mycket kapital. Koppla marginaler, ROIC-liknande ekonomi, capex och rörelsekapital.",
  "- Evidenskalibrering: conviction ska sjunka när nyckeldata saknas, är inaktuell eller motstridig. Gör aldrig okända indata till neutral säkerhet. Skilj datakonfidens från investeringsattraktivitet.",
  "- Portföljpassning mot fristående kvalitet: ett starkt bolag kan ändå vara ett dåligt tillskott på grund av faktor-, sektor-, valuta-, likviditets- eller korrelationskoncentration. Jämför alternativkostnad mot innehav och kassa.",
  "- Inkomstvärdepapper: för pref/D, bedöm emittentrisk, refinansiering, villkor/incitament och inlösenmekanik när de är verifierade. För utdelande ETF:er, bedöm totalavkastning, avgift och strategimekanik. Direktavkastning är inte ränta och inte garanterad.",
  "- Processkvalitet före utfallsbias: en bra process kan ha ett dåligt kortsiktigt utfall och en dålig process ett bra. Skriv inte om ett historiskt beslut i efterhand för att experimentet ska se bättre ut.",
].join("\n");
