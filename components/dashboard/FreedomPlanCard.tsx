"use client";

import { useMemo, useState } from "react";
import FireProjectionChart from "@/components/dashboard/FireProjectionChart";
import {
  calculateFreedomPlan,
  formatFreedomTimeline,
  formatSek,
  getCapitalProjectionSeries,
  type FreedomPlanMode,
} from "@/lib/dashboard/fire-calculator";

const defaultValues = {
  currentCapital: 250_000,
  monthlySavings: 5_000,
  targetMonthlyIncome: 25_000,
  targetCapital: 7_500_000,
  expectedYieldPercent: 4,
  expectedGrowthPercent: 7,
};

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
};

function formatFieldValue(value: number, suffix?: string) {
  if (suffix === "%") {
    return value.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
  }

  return Math.round(value).toLocaleString("sv-SE");
}

function parseFieldValue(raw: string) {
  const normalized = raw
    .replace(/\s/g, "")
    .replace(/[^\d.,-]/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: SliderFieldProps) {
  const displaySuffix = suffix === "%" ? "%" : suffix === "kr" ? " kr" : "";

  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <input
          type="text"
          inputMode="decimal"
          value={`${formatFieldValue(value, suffix)}${displaySuffix}`}
          onChange={(event) => {
            const parsed = parseFieldValue(event.target.value);
            onChange(Math.min(max, Math.max(min, parsed)));
          }}
          className="w-[9.5rem] rounded-lg border border-white/10 bg-[#111111] px-2.5 py-1.5 text-right text-xs text-white outline-none transition focus:border-[#D4AF37]/60"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#D4AF37]"
      />
    </label>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: FreedomPlanMode;
  onChange: (mode: FreedomPlanMode) => void;
}) {
  const options: { id: FreedomPlanMode; label: string }[] = [
    { id: "monthly-dividend", label: "Månadsutdelning" },
    { id: "capital-target", label: "Kapitalmål" },
  ];

  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-[#111111] p-1">
      {options.map((option) => {
        const isActive = mode === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
              isActive
                ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FreedomPlanCard() {
  const [mode, setMode] = useState<FreedomPlanMode>("monthly-dividend");
  const [currentCapital, setCurrentCapital] = useState(defaultValues.currentCapital);
  const [monthlySavings, setMonthlySavings] = useState(defaultValues.monthlySavings);
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(
    defaultValues.targetMonthlyIncome,
  );
  const [targetCapital, setTargetCapital] = useState(defaultValues.targetCapital);
  const [expectedYieldPercent, setExpectedYieldPercent] = useState(
    defaultValues.expectedYieldPercent,
  );
  const [expectedGrowthPercent, setExpectedGrowthPercent] = useState(
    defaultValues.expectedGrowthPercent,
  );

  const planInput = useMemo(
    () => ({
      mode,
      currentCapital,
      monthlySavings,
      targetMonthlyIncome,
      targetCapital,
      expectedYieldPercent,
      expectedGrowthPercent,
    }),
    [
      currentCapital,
      expectedGrowthPercent,
      expectedYieldPercent,
      mode,
      monthlySavings,
      targetCapital,
      targetMonthlyIncome,
    ],
  );

  const result = useMemo(() => calculateFreedomPlan(planInput), [planInput]);
  const projection = useMemo(
    () => getCapitalProjectionSeries(planInput),
    [planInput],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        Frihetsplan
      </p>
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
        Planera din utdelningsfrihet
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
        Justera antaganden och se direkt hur kapitalmål, tidslinje och
        uppskattad utdelning förändras.
      </p>

      <div className="mt-5 space-y-5">
        <ModeToggle mode={mode} onChange={setMode} />

        <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-4">
          <p className="text-lg font-medium leading-7 text-white">
            {formatFreedomTimeline(result.yearsToGoal)}
          </p>
          <div className="mt-3 space-y-1 text-sm text-gray-300">
            <p>
              Kapitalmål:{" "}
              <span className="font-medium text-white tabular-nums">
                {formatSek(result.capitalGoal)}
              </span>
            </p>
            <p>
              Beräknad månadsutdelning vid målet:{" "}
              <span className="font-medium text-white tabular-nums">
                {formatSek(result.monthlyDividendAtGoal)}
              </span>
            </p>
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-500">
            Uppskattning baserad på dina antaganden — inte en garanti.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField
            label="Nuvarande kapital"
            value={currentCapital}
            min={0}
            max={5_000_000}
            step={10_000}
            suffix="kr"
            onChange={setCurrentCapital}
          />
          <SliderField
            label="Månadssparande"
            value={monthlySavings}
            min={0}
            max={50_000}
            step={500}
            suffix="kr"
            onChange={setMonthlySavings}
          />
          {mode === "monthly-dividend" ? (
            <SliderField
              label="Önskad månadsutdelning"
              value={targetMonthlyIncome}
              min={5_000}
              max={100_000}
              step={1_000}
              suffix="kr"
              onChange={setTargetMonthlyIncome}
            />
          ) : (
            <SliderField
              label="Eget kapitalmål"
              value={targetCapital}
              min={500_000}
              max={20_000_000}
              step={50_000}
              suffix="kr"
              onChange={setTargetCapital}
            />
          )}
          <SliderField
            label="Förväntad direktavkastning"
            value={expectedYieldPercent}
            min={1}
            max={10}
            step={0.5}
            suffix="%"
            onChange={setExpectedYieldPercent}
          />
          <SliderField
            label="Förväntad årlig tillväxt"
            value={expectedGrowthPercent}
            min={0}
            max={15}
            step={0.5}
            suffix="%"
            onChange={setExpectedGrowthPercent}
          />
        </div>

        <FireProjectionChart
          data={projection.points}
          targetCapital={projection.targetCapital}
          targetReachYear={projection.targetReachYear}
          exceedsHorizon={projection.exceedsHorizon}
        />
      </div>

      <p className="mt-5 text-xs leading-5 text-gray-500">
        Endast utbildande uppskattning. Inte finansiell rådgivning.
      </p>
    </section>
  );
}
