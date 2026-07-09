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
        className="divlab-input w-full px-3.5 py-2.5 placeholder:text-gray-600"
      />
    </label>
  );
}
