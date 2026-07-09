"use client";

const periods = ["1M", "6M", "1Å", "5Å", "ALL"] as const;

export type Period = (typeof periods)[number];

type Props = {
  period: Period;
  setPeriod: (value: Period) => void;
};

export default function TimeFilter({ period, setPeriod }: Props) {
  return (
    <div className="flex gap-2">
      {periods.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={period === item}
          onClick={() => setPeriod(item)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            period === item
              ? "divlab-selected"
              : "text-divlab-text-muted hover:text-divlab-text"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}