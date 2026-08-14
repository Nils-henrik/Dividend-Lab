import { z } from "zod";
import type { ModelPortfolioStrategyKey } from "./policy";

export const modelPortfolioActionSchema = z.enum(["hold", "buy", "sell", "trim", "rebalance"]);

export const modelPortfolioDecisionSchema = z.object({
  action: modelPortfolioActionSchema,
  symbol: z.string().trim().min(1).max(32).nullable(),
  exchange: z.string().trim().min(1).max(16).nullable(),
  instrumentName: z.string().trim().min(1).max(120).nullable(),
  proposedPortfolioPct: z.number().min(0).max(100),
  convictionScore: z.number().min(0).max(1),
  materialThesisBreak: z.boolean(),
  thesis: z.string().trim().min(20).max(1200),
  bearCase: z.string().trim().min(20).max(900),
  catalyst: z.string().trim().min(10).max(700),
  valuationView: z.string().trim().min(10).max(700),
  keyRisks: z.array(z.string().trim().min(5).max(300)).min(1).max(6),
  evidenceIds: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
  disconfirmingEvidenceIds: z.array(z.string().trim().min(1).max(120)).max(8),
  rationale: z.string().trim().min(30).max(1600),
});

export type ModelPortfolioDecision = z.infer<typeof modelPortfolioDecisionSchema>;

export type ModelPortfolioEvidence = {
  id: string;
  kind: "market_data" | "company_report" | "company_release" | "regulatory" | "news" | "macro";
  publisher: string;
  publishedAt: string;
  verifiedAt: string;
  title: string;
  summary: string;
};

const PROFILE_FOCUS: Record<ModelPortfolioStrategyKey, readonly string[]> = {
  conservative: [
    "balansräkning och finansieringsrisk",
    "stabilitet i vinst och kassaflöde",
    "värderingsmarginal och nedsiderisk",
    "diversifiering och korrelation mot befintliga innehav",
  ],
  balanced: [
    "kvalitet och avkastning på kapital",
    "värdering relativt tillväxt och historik",
    "vinstrevideringar och konkurrensposition",
    "portföljens sektor- och bolagsrisk",
  ],
  high_risk: [
    "katalysator och sannolik tidslinje",
    "vinst- eller tillväxtacceleration",
    "fallen-quality/recovery: om kvaliteten är intakt, varför aktien föll och om entryn faktiskt har börjat stabiliseras",
    "small/mid-cap-möjligheter i Norden och USA, utan att offra likviditet, evidens eller riskkontroll",
    "asymmetri mellan uppsida och nedsida",
    "likviditet, finansieringsrisk och vad som invalidiserar caset",
  ],
  dividend: [
    "fritt kassaflöde och utdelningstäckning",
    "skuldsättning och refinansieringsrisk",
    "utdelningshistorik och sannolik utdelningstillväxt",
    "totalavkastning och risk för yield trap",
  ],
};

const START_PHASE_MAX_POSITION_PCT: Record<ModelPortfolioStrategyKey, number> = {
  conservative: 40,
  balanced: 50,
  high_risk: 100,
  dividend: 100,
};

export function buildDecisionFramework(strategyKey: ModelPortfolioStrategyKey): string {
  const focus = PROFILE_FOCUS[strategyKey];
  const maxPositionPct = START_PHASE_MAX_POSITION_PCT[strategyKey];
  return [
    "INVESTERINGSRAMVERK:",
    "1. Börja alltid med frågan: finns det tillräckligt stark evidens för att INTE välja HOLD?",
    "2. Skilj fakta från tolkning. Använd endast evidens som finns i det givna underlaget.",
    "3. En enskild rubrik, kursrörelse eller social signal får aldrig ensam motivera en affär.",
    "4. Sök aktivt efter information som motsäger huvudtesen innan conviction sätts. Om ingen separat motbeviskälla finns i underlaget ska du inte hitta på en eller återanvända en stödkälla bara för att fylla disconfirmingEvidenceIds.",
    "5. Bedöm bolaget, men också portföljkonsekvensen. Ett bra bolag kan vara ett dåligt köp om koncentration eller pris är fel.",
    "6. Köp kräver positiv tes, rimlig värderingsbild, identifierad katalysator eller uthållig compounding-tes samt tydlig nedsidesanalys.",
    "7. Sälj kräver i första hand tesbrott, kraftigt försämrad risk/reward, bättre kapitalallokering eller regelstyrd riskreduktion. Kursfall i sig är inte ett säljargument.",
    "8. Kursuppgång i sig är inte ett säljargument. Vinsthemtagning måste kunna motiveras av värdering, koncentration eller försämrad framtida risk/reward.",
    "9. Om datan är motsägelsefull, gammal eller otillräcklig: HOLD och sänk conviction.",
    "10. Motiveringen ska vara kort, konkret och begriplig för en vanlig DivLab-användare.",
    "AKTIV STARTFAS-SIZING 2026-08-14:",
    `- Minsta meningsfulla affär är 10 % av portföljvärdet. Absolut maxvikt för en enskild position i denna startfas är ${maxPositionPct} %.`,
    "- Maxvikten är endast ett tekniskt tak för en liten portfölj med handel i hela aktier. Den är INTE en målposition och INTE en uppmaning att använda hela utrymmet.",
    "- Riskspridning över flera välunderbyggda innehav ska eftersträvas. Föredra normalt en klart lägre vikt än max när flera bra case finns tillgängliga.",
    "- Lägg inte alla ägg i samma korg bara för att maxgränsen tillåter det. Mycket hög koncentration kräver exceptionellt stark evidens och får aldrig användas för att skapa aktivitet.",
    "- Dessa startfasgränser ersätter äldre numeriska maxvikter som kan förekomma tidigare i mandattexten. Den deterministiska riskvalidatorn är alltid slutlig.",
    "PROFILENS EXTRA FOKUS:",
    ...focus.map((item) => `- ${item}`),
    "OUTPUTDISCIPLIN:",
    "- action måste vara hold, buy, sell, trim eller rebalance.",
    "- convictionScore är styrkan i beslutet, inte säkerheten i framtida avkastning.",
    "- materialThesisBreak får endast vara true när verifierad ny information faktiskt bryter en central del av tidigare tes.",
    "- evidenceIds måste peka på givna evidensposter. Hitta aldrig på källor, priser, rapporttal eller händelser.",
    "- disconfirmingEvidenceIds får endast innehålla verkliga givna evidensposter som faktiskt motsäger eller försvagar tesen. Lämna listan tom om den aktiva motbeviskontrollen inte hittar en separat sådan post.",
    "- proposedPortfolioPct är önskad målviktsförändring före deterministisk riskvalidering och är aldrig ett exekveringskommando.",
  ].join("\n");
}

export function validateEvidenceReferences(
  decision: ModelPortfolioDecision,
  evidence: readonly ModelPortfolioEvidence[],
): { ok: true } | { ok: false; reason: "unknown_evidence" } {
  const ids = new Set(evidence.map((item) => item.id));
  const allReferenced = [...decision.evidenceIds, ...decision.disconfirmingEvidenceIds];
  if (allReferenced.some((id) => !ids.has(id))) {
    return { ok: false, reason: "unknown_evidence" };
  }
  return { ok: true };
}
