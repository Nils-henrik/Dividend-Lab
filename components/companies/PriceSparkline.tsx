import { quoteToneClass, type QuoteTone } from "@/lib/companies/watchlist";

type Props = {
  values: readonly number[] | null;
  tone: QuoteTone;
};

export default function PriceSparkline({ values, tone }: Props) {
  if (!values || values.length < 2) {
    return null;
  }

  const width = 112;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      role="img"
      aria-label="Senaste stängningskurser"
      viewBox={`0 0 ${width} ${height}`}
      className={`h-9 w-28 ${quoteToneClass(tone)}`}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
