"use client";

import { useId, useMemo, useState } from "react";
import FireProjectionChart from "@/components/dashboard/FireProjectionChart";
import {
  calculateFreedomPlan,
  formatEstimatedAgeAtGoal,
  formatFreedomTimeline,
  formatSek,
  getCapitalProjectionSeries,
  type FreedomPlanMode,
} from "@/lib/dashboard/fire-calculator";

const defaultValues = {
  currentAge: 35,
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

type ResultMetricProps = {
  label: string;
  value: string;
};

function formatFieldValue(value: number, suffix?: string) {
  if (suffix === "%") {
    return value.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
  }

  if (suffix === "år") {
    return Math.round(value).toLocaleString("sv-SE");
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
  const fieldId = useId();
  const displaySuffix =
    suffix === "%" ? "%" : suffix === "kr" ? " kr" : suffix === "år" ? " år" : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={`${fieldId}-value`}
          className="text-xs font-medium text-gray-400"
        >
          {label}
        </label>
        <input
          id={`${fieldId}-value`}
          type="text"
          inputMode="decimal"
          value={`${formatFieldValue(value, suffix)}${displaySuffix}`}
          onChange={(event) => {
            const parsed = parseFieldValue(event.target.value);
            onChange(Math.min(max, Math.max(min, parsed)));
          }}
          className="w-[9.5rem] rounded-lg border border-white/10 bg-[#111111] px-2.5 py-1.5 text-right text-xs text-white outline-none transition focus:border-divlab-blue/40"
        />
      </div>
      <input
        type="range"
        aria-label={`${label} reglage`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-divlab-blue"
      />
    </div>
  );
}

function ResultMetric({ label, value }: ResultMetricProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white tabular-nums">{value}</p>
    </div>
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
                ? "divlab-selected"
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
  const [currentAge, setCurrentAge] = useState(defaultValues.currentAge);
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

  const estimatedAgeAtGoal = formatEstimatedAgeAtGoal(currentAge, result.yearsToGoal);
  const targetReachAge =
    result.yearsToGoal === null
      ? null
      : Math.round(currentAge + result.yearsToGoal);
  const goalReached =
    !result.exceedsHorizon && result.yearsToGoal !== null && result.yearsToGoal >= 0;

  return (
    <section className="divlab-card p-5 sm:p-6">
      <p className="mb-3 divlab-section-label">Frihetsplan</p>
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
        Planera din ekonomiska frihet
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
        Ändra ett värde så räknas tidslinjen och grafen om direkt. Testa hur
        sparande, kapitalmål och avkastning påverkar vägen framåt.
      </p>

      <div className="mt-5 space-y-5">
        <div className="rounded-xl border border-divlab-blue/20 bg-divlab-blue/5 px-4 py-4 sm:px-5">
          {result.exceedsHorizon ? (
            <div className="space-y-2">
              <p className="text-lg font-medium leading-7 text-white">
                {formatFreedomTimeline(result.yearsToGoal)}
              </p>
              <p className="text-sm leading-6 text-gray-300">
                Höj sparandet, justera målet eller ändra antagandena för att se
                en tydligare tidslinje.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xl font-semibold leading-7 text-white">
                {formatFreedomTimeline(result.yearsToGoal)}
              </p>
              {goalReached && estimatedAgeAtGoal && (
                <p className="mt-1 text-sm leading-6 text-gray-300">
                  {estimatedAgeAtGoal}
                </p>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <ResultMetric
                  label="Kapitalmål"
                  value={formatSek(result.capitalGoal)}
                />
                <ResultMetric
                  label="Kapital idag"
                  value={formatSek(currentCapital)}
                />
                <ResultMetric
                  label="Framsteg"
                  value={`${Math.round(result.monthlyDividendProgressPercent)}%`}
                />
                <ResultMetric
                  label="Utdelning vid mål"
                  value={`${formatSek(result.monthlyDividendAtGoal)}/mån`}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-400">
                Med dagens kapital motsvarar den valda direktavkastningen cirka{" "}
                <span className="font-medium text-gray-200 tabular-nums">
                  {formatSek(result.estimatedMonthlyDividend)}/mån
                </span>{" "}
                i uppskattad utdelning.
              </p>
            </>
          )}
          <p className="mt-3 text-xs leading-5 text-gray-500">
            Beräkningen är en förenklad prognos baserad på dina egna antaganden.
          </p>
        </div>

        <div className="rounded-xl border divlab-border-neutral bg-white/[0.015] p-4 sm:p-5">
          <p className="divlab-section-label">Du idag</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SliderField
              label="Din ålder"
              value={currentAge}
              min={18}
              max={80}
              step={1}
              suffix="år"
              onChange={setCurrentAge}
            />
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
          </div>
        </div>

        <div className="rounded-xl border divlab-border-neutral bg-white/[0.015] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="divlab-section-label">Ditt mål</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Välj om du vill räkna mot månadsutdelning eller ett eget kapitalmål.
              </p>
            </div>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
          <div className="mt-4 max-w-xl">
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
          </div>
        </div>

        <div className="rounded-xl border divlab-border-neutral bg-white/[0.015] p-4 sm:p-5">
          <p className="divlab-section-label">Antaganden</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Antagandena är till för scenarier och ska inte tolkas som en prognos.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
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
              label="Förväntad kursutveckling"
              value={expectedGrowthPercent}
              min={0}
              max={15}
              step={0.5}
              suffix="%"
              onChange={setExpectedGrowthPercent}
            />
          </div>
        </div>

        <FireProjectionChart
          data={projection.points}
          targetCapital={projection.targetCapital}
          targetReachYear={projection.targetReachYear}
          targetReachAge={targetReachAge}
          currentAge={currentAge}
          exceedsHorizon={projection.exceedsHorizon}
        />
      </div>

      <p className="mt-5 text-xs leading-5 text-gray-500">
        Endast utbildande uppskattning. Inte finansiell rådgivning.
      </p>
    </section>
  );
}
