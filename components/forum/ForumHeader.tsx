import ForumSearch from "./ForumSearch";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategoryName: string;
};

export default function ForumHeader({
  searchQuery,
  onSearchChange,
  activeCategoryName,
}: Props) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#111111]/85 p-3.5">
      <div className="grid gap-4 xl:grid-cols-[1fr_420px] xl:items-center">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
            Dividend Lab Forum
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            {activeCategoryName}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            Learn from experienced investors, review portfolio thinking and
            find durable income ideas without market noise.
          </p>
        </div>

        <ForumSearch
          value={searchQuery}
          onChange={onSearchChange}
          activeCategoryName={activeCategoryName}
        />
      </div>
    </section>
  );
}
