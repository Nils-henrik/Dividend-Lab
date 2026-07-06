import type { ForumCategory } from "@/types/forum";

type Props = {
  category: ForumCategory;
};

export default function ForumCategoryCard({ category }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161616] p-5 transition hover:border-[#D4AF37]/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">{category.name}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            {category.description}
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1 text-xs text-gray-500">
          {category.latestActivity}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Discussions
          </p>
          <p className="mt-2 text-white tabular-nums">{category.discussions}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Posts
          </p>
          <p className="mt-2 text-white tabular-nums">{category.posts}</p>
        </div>
      </div>
    </div>
  );
}
