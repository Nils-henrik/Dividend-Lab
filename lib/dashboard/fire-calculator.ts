export type FreedomPlanMode = "monthly-dividend" | "capital-target";

export type FreedomPlanInput = {
  mode: FreedomPlanMode;
  currentCapital: number;
  monthlySavings: number;
  targetMonthlyIncome: number;
  targetCapital: number;
  expectedYieldPercent: number;
  expectedGrowthPercent: number;
};

export type FreedomPlanResult = {
  capitalGoal: number;
  monthlyDividendAtGoal: number;
  yearsToGoal: number | null;
  targetReachYear: number | null;
  exceedsHorizon: boolean;
};

export type CapitalProjectionPoint = {
  year: string;
  capital: number;
  isGoalReached?: boolean;
};

export type CapitalProjectionSeries = {
  points: CapitalProjectionPoint[];
  targetCapital: number;
  targetReachYear: number | null;
  exceedsHorizon: boolean;
};

const MAX_HORIZON_YEARS = 50;
const MAX_MONTHS = MAX_HORIZON_YEARS * 12;

function clampNonNegative(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function getMonthlyRate(expectedGrowthPercent: number) {
  const growth = clampNonNegative(expectedGrowthPercent);

  if (growth <= 0) {
    return 0;
  }

  return (1 + growth / 100) ** (1 / 12) - 1;
}

export function resolveCapitalGoal(input: FreedomPlanInput) {
  const expectedYieldPercent = clampNonNegative(input.expectedYieldPercent);

  if (input.mode === "capital-target") {
    const capitalGoal = clampNonNegative(input.targetCapital);

    return {
      capitalGoal,
      monthlyDividendAtGoal:
        expectedYieldPercent > 0
          ? (capitalGoal * (expectedYieldPercent / 100)) / 12
          : 0,
    };
  }

  const targetMonthlyIncome = clampNonNegative(input.targetMonthlyIncome);
  const annualDividendAtGoal = targetMonthlyIncome * 12;
  const capitalGoal =
    expectedYieldPercent > 0
      ? annualDividendAtGoal / (expectedYieldPercent / 100)
      : 0;

  return {
    capitalGoal,
    monthlyDividendAtGoal: targetMonthlyIncome,
  };
}

function simulateMonthsToGoal(
  currentCapital: number,
  monthlySavings: number,
  capitalGoal: number,
  monthlyRate: number,
) {
  if (capitalGoal <= 0) {
    return {
      months: null,
      exceedsHorizon: true,
    };
  }

  if (currentCapital >= capitalGoal) {
    return {
      months: 0,
      exceedsHorizon: false,
    };
  }

  let capital = currentCapital;
  let months = 0;

  while (capital < capitalGoal && months < MAX_MONTHS) {
    capital = capital * (1 + monthlyRate) + monthlySavings;
    months += 1;
  }

  if (months >= MAX_MONTHS) {
    return {
      months: null,
      exceedsHorizon: true,
    };
  }

  return {
    months,
    exceedsHorizon: false,
  };
}

export function calculateFreedomPlan(input: FreedomPlanInput): FreedomPlanResult {
  const currentCapital = clampNonNegative(input.currentCapital);
  const monthlySavings = clampNonNegative(input.monthlySavings);
  const { capitalGoal, monthlyDividendAtGoal } = resolveCapitalGoal(input);

  if (capitalGoal <= 0) {
    return {
      capitalGoal: 0,
      monthlyDividendAtGoal,
      yearsToGoal: null,
      targetReachYear: null,
      exceedsHorizon: true,
    };
  }

  const { months, exceedsHorizon } = simulateMonthsToGoal(
    currentCapital,
    monthlySavings,
    capitalGoal,
    getMonthlyRate(input.expectedGrowthPercent),
  );

  const yearsToGoal = months === null ? null : months / 12;
  const targetReachYear =
    months === null ? null : months === 0 ? 0 : Math.ceil(months / 12);

  return {
    capitalGoal,
    monthlyDividendAtGoal,
    yearsToGoal,
    targetReachYear,
    exceedsHorizon,
  };
}

export function getCapitalProjectionSeries(
  input: FreedomPlanInput,
): CapitalProjectionSeries {
  const currentCapital = clampNonNegative(input.currentCapital);
  const monthlySavings = clampNonNegative(input.monthlySavings);
  const monthlyRate = getMonthlyRate(input.expectedGrowthPercent);
  const plan = calculateFreedomPlan(input);
  const targetCapital = plan.capitalGoal;

  let capital = currentCapital;
  const points: CapitalProjectionPoint[] = [
    { year: "0", capital: Math.round(capital) },
  ];

  const horizonYears =
    plan.targetReachYear !== null && !plan.exceedsHorizon
      ? Math.min(MAX_HORIZON_YEARS, Math.max(10, plan.targetReachYear + 3))
      : 30;

  for (let year = 1; year <= horizonYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      capital = capital * (1 + monthlyRate) + monthlySavings;
    }

    points.push({
      year: `${year}`,
      capital: Math.round(capital),
      isGoalReached: plan.targetReachYear === year,
    });
  }

  return {
    points,
    targetCapital: Math.round(targetCapital),
    targetReachYear: plan.targetReachYear,
    exceedsHorizon: plan.exceedsHorizon,
  };
}

export function formatSek(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}

export function formatFreedomTimeline(years: number | null) {
  if (years === null) {
    return "Målet nås inte inom 50 år med nuvarande antaganden";
  }

  if (years <= 0) {
    return "Du har redan nått kapitalmålet";
  }

  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12));
    return `Du når målet om cirka ${months} ${months === 1 ? "månad" : "månader"}`;
  }

  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);

  if (months === 0) {
    return `Du når målet om cirka ${wholeYears} ${wholeYears === 1 ? "år" : "år"}`;
  }

  return `Du når målet om cirka ${wholeYears} ${wholeYears === 1 ? "år" : "år"} och ${months} ${months === 1 ? "månad" : "månader"}`;
}

/** @deprecated Use calculateFreedomPlan */
export function calculateFirePlan(input: {
  currentCapital: number;
  monthlySavings: number;
  targetMonthlyIncome: number;
  expectedYieldPercent: number;
  expectedGrowthPercent: number;
}) {
  const result = calculateFreedomPlan({
    mode: "monthly-dividend",
    currentCapital: input.currentCapital,
    monthlySavings: input.monthlySavings,
    targetMonthlyIncome: input.targetMonthlyIncome,
    targetCapital: 0,
    expectedYieldPercent: input.expectedYieldPercent,
    expectedGrowthPercent: input.expectedGrowthPercent,
  });

  return {
    requiredCapital: result.capitalGoal,
    yearsToGoal: result.yearsToGoal,
    annualDividendAtGoal: result.monthlyDividendAtGoal * 12,
  };
}

/** @deprecated Use formatFreedomTimeline */
export function formatYearsToGoal(years: number | null) {
  return formatFreedomTimeline(years);
}
