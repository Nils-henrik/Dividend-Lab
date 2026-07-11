import Link from "next/link";
import type { ForumCategory } from "@/types/forum";

type Props = {
  category: ForumCategory;
  isActive: boolean;
  onSelect?: (categorySlug: string) => void;
  enhancedContrast?: boolean;
};

export default function ForumCategoryItem({
  category,
  isActive,
  onSelect,
  enhancedContrast = false,
}: Props) {
  const className = `flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs leading-4 transition ${
    isActive
      ? "divlab-selected"
      : enhancedContrast
        ? "text-divlab-text-secondary hover:text-divlab-text"
        : "text-divlab-text-muted divlab-row-hover hover:text-divlab-text"
  }`;

  const content = (
    <>
      <span className="truncate">{category.name}</span>
      <span
        className={`text-[10px] tabular-nums ${
          enhancedContrast ? "text-gray-500" : "text-divlab-text-subtle"
        }`}
      >
        {category.discussions}
      </span>
    </>
  );

  if (!onSelect) {
    return (
      <Link
        href={`/forum/kategorier/${category.slug}`}
        className={className}
      >
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
