type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
};

export default function ForumSearch({
  value,
  onChange,
  placeholder = "Sök diskussioner i forumet...",
  hint = "Söker bland inlästa diskussioner efter rubrik, kategori och avsändare.",
}: Props) {
  return (
    <label className="block">
      <span className="sr-only">Sök i forumet</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full divlab-input px-3 py-2.5 text-divlab-text placeholder:text-divlab-text-subtle"
      />
      <span className="mt-1.5 block text-[11px] text-gray-600">{hint}</span>
    </label>
  );
}
