type StatCardProps = {
  title: string;
  value: string;
  change: string;
};

export default function StatCard({ title, value, change }: StatCardProps) {
  return (
    <div className="divlab-surface-panel px-5 py-5 transition-all duration-300 hover:border-divlab-border-strong">
      <p className="min-h-[28px] text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-divlab-text-muted">
        {title}
      </p>

      <h2 className="mt-5 whitespace-nowrap text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-divlab-text tabular-nums">
        {value}
      </h2>

      <p className="mt-5 text-sm font-medium text-divlab-green tabular-nums">
        {change}
      </p>
    </div>
  );
}
