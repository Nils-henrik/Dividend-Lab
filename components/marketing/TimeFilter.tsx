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
              ? "border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}