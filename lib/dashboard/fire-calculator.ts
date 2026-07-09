export type FireCalculatorInput = {
  currentCapital: number;
  monthlySavings: number;
  targetMonthlyIncome: number;
  expectedYieldPercent: number;
  expectedGrowthPercent: number;
};

export type FireCalculatorResult = {
  requiredCapital: number;
  yearsToGoal: number | null;
  annualDividendAtGoal: number;
};

function clampNonNegative(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

export function calculateFirePlan(input: FireCalculatorInput): FireCalculatorResult {
  const currentCapital = clampNonNegative(input.currentCapital);
  const monthlySavings = clampNonNegative(input.monthlySavings);
  const targetMonthlyIncome = clampNonNegative(input.targetMonthlyIncome);
  const expectedYieldPercent = clampNonNegative(input.expectedYieldPercent);
  const expectedGrowthPercent = clampNonNegative(input.expectedGrowthPercent);

  const annualDividendAtGoal = targetMonthlyIncome * 12;
  const requiredCapital =
    expectedYieldPercent > 0
      ? annualDividendAtGoal / (expectedYieldPercent / 100)
      : 0;

  if (requiredCapital <= 0) {
    return {
      requiredCapital: 0,
      yearsToGoal: null,
      annualDividendAtGoal,
    };
  }

  if (currentCapital >= requiredCapital) {
    return {
      requiredCapital,
      yearsToGoal: 0,
      annualDividendAtGoal,
    };
  }

  const monthlyRate =
    expectedGrowthPercent > 0
      ? (1 + expectedGrowthPercent / 100) ** (1 / 12) - 1
      : 0;

  let capital = currentCapital;
  let months = 0;
  const maxMonths = 12 * 100;

  while (capital < requiredCapital && months < maxMonths) {
    capital = capital * (1 + monthlyRate) + monthlySavings;
    months += 1;
  }

  return {
    requiredCapital,
    yearsToGoal: months >= maxMonths ? null : months / 12,
    annualDividendAtGoal,
  };
}

export function formatSek(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}

export function formatYearsToGoal(years: number | null) {
  if (years === null) {
    return "Mer än 100 år";
  }

  if (years <= 0) {
    return "Du har nått målet";
  }

  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12));
    return `Ca ${months} månader`;
  }

  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);

  if (months === 0) {
    return `Ca ${wholeYears} år`;
  }

  return `Ca ${wholeYears} år och ${months} månader`;
}

export type CapitalProjectionPoint = {
  year: string;
  capital: number;
};

export function getCapitalProjectionSeries(
  input: FireCalculatorInput,
): CapitalProjectionPoint[] {
  const currentCapital = clampNonNegative(input.currentCapital);
  const monthlySavings = clampNonNegative(input.monthlySavings);
  const expectedGrowthPercent = clampNonNegative(input.expectedGrowthPercent);
  const plan = calculateFirePlan(input);

  const monthlyRate =
    expectedGrowthPercent > 0
      ? (1 + expectedGrowthPercent / 100) ** (1 / 12) - 1
      : 0;

  const horizonYears =
    plan.yearsToGoal !== null
      ? Math.min(40, Math.max(10, Math.ceil(plan.yearsToGoal) + 3))
      : 30;

  let capital = currentCapital;
  const points: CapitalProjectionPoint[] = [
    { year: "0", capital: Math.round(capital) },
  ];

  for (let year = 1; year <= horizonYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      capital = capital * (1 + monthlyRate) + monthlySavings;
    }

    points.push({
      year: `${year}`,
      capital: Math.round(capital),
    });
  }

  return points;
}
