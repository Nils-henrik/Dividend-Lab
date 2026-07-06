type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function PortfolioSearch({ value, onChange }: Props) {
  return (
    <label className="block">
      <span className="sr-only">Search portfolio companies</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search a company in your portfolio..."
        className="w-full rounded-xl border border-white/10 bg-[#090909] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/60"
      />
    </label>
  );
}
