type StatCardProps = {
  title: string;
  value: string;
  change: string;
  icon?: string;
};

export default function StatCard({
  title,
  value,
  change,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161616] p-6 transition-all duration-300 hover:border-[#D4AF37]/50 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">

      <div className="flex items-center justify-between">

        <p className="text-xs uppercase tracking-wider text-gray-500">
          {title}
        </p>

        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10">
            <span>{icon}</span>
          </div>
        )}

      </div>

      <h2 className="mt-6 text-4xl font-bold text-white">
        {value}
      </h2>

      <p className="mt-3 text-sm font-medium text-green-400">
        {change}
      </p>

    </div>
  );
}