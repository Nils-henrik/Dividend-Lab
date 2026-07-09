"use client";

import { useMemo, useState } from "react";
import {
  calculateFirePlan,
  formatSek,
  formatYearsToGoal,
} from "@/lib/dashboard/fire-calculator";

const defaultValues = {
  currentCapital: "250000",
  monthlySavings: "5000",
  targetMonthlyIncome: "25000",
  expectedYieldPercent: "4",
  expectedGrowthPercent: "7",
};

function parseInput(value: string) {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function FireCalculatorCard() {
  const [currentCapital, setCurrentCapital] = useState(defaultValues.currentCapital);
  const [monthlySavings, setMonthlySavings] = useState(defaultValues.monthlySavings);
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(
    defaultValues.targetMonthlyIncome,
  );
  const [expectedYieldPercent, setExpectedYieldPercent] = useState(
    defaultValues.expectedYieldPercent,
  );
  const [expectedGrowthPercent, setExpectedGrowthPercent] = useState(
    defaultValues.expectedGrowthPercent,
  );

  const result = useMemo(
    () =>
      calculateFirePlan({
        currentCapital: parseInput(currentCapital),
        monthlySavings: parseInput(monthlySavings),
        targetMonthlyIncome: parseInput(targetMonthlyIncome),
        expectedYieldPercent: parseInput(expectedYieldPercent),
        expectedGrowthPercent: parseInput(expectedGrowthPercent),
      }),
    [
      currentCapital,
      expectedGrowthPercent,
      expectedYieldPercent,
      monthlySavings,
      targetMonthlyIncome,
    ],
  );

  const inputClassName =
    "w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/60";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        Frihetskalkylator
      </p>
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
        Planera din utdelningsfrihet
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
        Uppskatta hur mycket kapital som kan krävas och hur lång tid det kan ta
        att nå en önskad månadsinkomst från utdelningar.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-400">Nuvarande kapital</span>
          <input
            type="text"
            inputMode="decimal"
            value={currentCapital}
            onChange={(event) => setCurrentCapital(event.target.value)}
            className={`${inputClassName} mt-2`}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-400">Månadssparande</span>
          <input
            type="text"
            inputMode="decimal"
            value={monthlySavings}
            onChange={(event) => setMonthlySavings(event.target.value)}
            className={`${inputClassName} mt-2`}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-400">
            Önskad månadsinkomst från utdelningar
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={targetMonthlyIncome}
            onChange={(event) => setTargetMonthlyIncome(event.target.value)}
            className={`${inputClassName} mt-2`}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-400">
            Förväntad direktavkastning (%)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={expectedYieldPercent}
            onChange={(event) => setExpectedYieldPercent(event.target.value)}
            className={`${inputClassName} mt-2`}
          />
        </label>
        <label className="block md:col-span-2 xl:col-span-2">
          <span className="text-xs font-medium text-gray-400">
            Förväntad årlig tillväxt (%)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={expectedGrowthPercent}
            onChange={(event) => setExpectedGrowthPercent(event.target.value)}
            className={`${inputClassName} mt-2`}
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Ungefärligt kapital som krävs
          </p>
          <p className="mt-3 text-xl font-medium tracking-[-0.03em] text-white tabular-nums">
            {formatSek(result.requiredCapital)}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Estimerad tid till målet
          </p>
          <p className="mt-3 text-xl font-medium tracking-[-0.03em] text-white">
            {formatYearsToGoal(result.yearsToGoal)}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Estimerad årlig utdelning vid målet
          </p>
          <p className="mt-3 text-xl font-medium tracking-[-0.03em] text-white tabular-nums">
            {formatSek(result.annualDividendAtGoal)}
          </p>
        </article>
      </div>

      <p className="mt-5 text-xs leading-5 text-gray-500">
        Endast utbildande uppskattning. Inte finansiell rådgivning.
      </p>
    </section>
  );
}
