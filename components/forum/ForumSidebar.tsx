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
    <aside className="sticky top-24 divlab-card p-3">
      <div className="border-b divlab-border-neutral px-1 pb-3">
        <p className="divlab-section-label text-[11px]">Forum</p>
        <p className="mt-1.5 text-[11px] leading-5 text-divlab-text-muted">
          Ämnen för långsiktigt investerande.
        </p>
      </div>

      <nav className="mt-2 space-y-1">
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
