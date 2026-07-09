import Link from "next/link";
import type { ForumCategory } from "@/types/forum";

type Props = {
  category: ForumCategory;
  isActive: boolean;
  onSelect?: (categorySlug: string) => void;
};

export default function ForumCategoryItem({
  category,
  isActive,
  onSelect,
}: Props) {
  const className = `flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs leading-4 transition ${
    isActive
      ? "divlab-selected"
      : "text-divlab-text-muted divlab-row-hover hover:text-divlab-text"
  }`;

  const content = (
    <>
      <span className="truncate">{category.name}</span>
      <span className="text-[10px] text-divlab-text-subtle tabular-nums">
        {category.discussions}
      </span>
    </>
  );

  if (!onSelect) {
    return (
      <Link href={`/forum?category=${category.slug}`} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onSelect(category.slug)} className={className}>
      {content}
    </button>
  );
}
