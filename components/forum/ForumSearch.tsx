type Props = {
  value: string;
  onChange: (value: string) => void;
  activeCategoryName?: string;
};

export default function ForumSearch({
  value,
  onChange,
  activeCategoryName,
}: Props) {
  return (
    <label className="block">
      <span className="sr-only">Sök i forumet</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          activeCategoryName
            ? `Sök diskussioner i ${activeCategoryName}...`
            : "Sök diskussioner i forumet..."
        }
        className="w-full rounded-lg border border-white/10 bg-[#161616] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/60"
      />
      <span className="mt-1.5 block text-[11px] text-gray-600">
        Sök på rubrik, kategori, tagg, bolag, ETF, fond, ticker och användarnamn.
      </span>
    </label>
  );
}
