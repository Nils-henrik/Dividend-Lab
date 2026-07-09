import { forumCategoryGroups } from "@/data/forum";
import type { ForumCategoryGroup as ForumCategoryGroupType } from "@/types/forum";
import ForumCategoryGroup from "./ForumCategoryGroup";

type Props = {
  activeCategorySlug: string;
  categoryGroups?: ForumCategoryGroupType[];
  onSelectCategory?: (categorySlug: string) => void;
};

export default function ForumSidebar({
  activeCategorySlug,
  categoryGroups = forumCategoryGroups,
  onSelectCategory,
}: Props) {
  return (
    <aside className="sticky top-24 rounded-md border border-white/10 bg-[#111111]/85 p-2">
      <div className="border-b border-white/10 px-1.5 pb-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
          Forum
        </p>
        <p className="mt-1 text-[11px] leading-4 text-gray-500">
          Ämnen för långsiktigt investerande.
        </p>
      </div>

      <nav className="mt-1.5 space-y-1">
        {categoryGroups.map((group) => (
          <ForumCategoryGroup
            key={group.slug}
            group={group}
            activeCategorySlug={activeCategorySlug}
            onSelect={onSelectCategory}
          />
        ))}
      </nav>
    </aside>
  );
}
