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
        className="w-full divlab-input px-3 py-2.5 text-divlab-text placeholder:text-divlab-text-subtle"
      />
      <span className="mt-1.5 block text-[11px] text-gray-600">
        Sök på rubrik, kategori, tagg, bolag, ETF, fond, ticker och användarnamn.
      </span>
    </label>
  );
}
