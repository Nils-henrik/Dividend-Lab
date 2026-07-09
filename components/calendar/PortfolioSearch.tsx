type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function PortfolioSearch({ value, onChange }: Props) {
  return (
    <label className="block">
      <span className="sr-only">Sök bolag i portföljen</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Sök ett bolag i din portfölj..."
        className="w-full rounded-xl border border-white/10 bg-[#090909] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/60"
      />
    </label>
  );
}
