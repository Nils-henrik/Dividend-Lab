"use client";

import { createContext, useContext, type ReactNode } from "react";

export type AnalysisClientClaim = {
  text: string;
  sourceIds: string[];
};

export type AnalysisClientLevel = {
  lower: number;
  upper: number;
  center: number;
  distancePct: number;
  touches: number;
  strength: "weak" | "medium" | "strong";
};

export type AnalysisClientPayload = {
  instrument: {
    name: string;
    symbol: string;
    currency: string;
    currentPrice: number;
  };
  technical: {
    trendRegime: string;
    rsi14: number | null;
    priceVsSma50Pct: number | null;
    volumeRatio20: number | null;
    supports: AnalysisClientLevel[];
    resistances: AnalysisClientLevel[];
  };
  view: "positive" | "neutral" | "negative";
  riskLevel: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  fundamentalScore: number | null;
  baseScenario: {
    valuePerShare: number | null;
    upsideDownsidePct: number | null;
  } | null;
  investmentCase: AnalysisClientClaim[];
  fundamentalInterpretation: AnalysisClientClaim[];
  valuationInterpretation: AnalysisClientClaim[];
  catalysts: AnalysisClientClaim[];
  risks: AnalysisClientClaim[];
  sources: Array<{ id: string; number: number }>;
};

const AnalysisClientContext = createContext<AnalysisClientPayload | null>(null);

export function AnalysisClientProvider({
  analysis,
  children,
}: {
  analysis: AnalysisClientPayload;
  children: ReactNode;
}) {
  return (
    <AnalysisClientContext.Provider value={analysis}>
      {children}
    </AnalysisClientContext.Provider>
  );
}

export function useAnalysisClient(): AnalysisClientPayload | null {
  return useContext(AnalysisClientContext);
}
