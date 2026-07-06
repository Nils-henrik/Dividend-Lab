type StatCardProps = {
  title: string;
  value: string;
  change: string;
};

export default function StatCard({ title, value, change }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161616] px-5 py-5 transition-all duration-300 hover:border-[#D4AF37]/40 hover:shadow-[0_0_24px_rgba(212,175,55,0.08)]">
      <p className="min-h-[28px] text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-gray-500">
        {title}
      </p>

      <h2 className="mt-5 whitespace-nowrap text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-white tabular-nums">
        {value}
      </h2>

      <p className="mt-5 text-sm font-medium text-green-400 tabular-nums">
        {change}
      </p>
    </div>
  );
}