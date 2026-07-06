import AppIcon from "./AppIcon";

export default function SearchBar() {
  return (
    <label className="hidden w-72 items-center gap-3 rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-sm text-gray-500 xl:flex">
      <AppIcon name="search" className="h-4 w-4" />
      <input
        type="search"
        placeholder="Search Dividend Lab"
        className="w-full bg-transparent text-gray-300 outline-none placeholder:text-gray-600"
      />
    </label>
  );
}
