"use client";

import { useState } from "react";
import type { ForumCategoryGroup as ForumCategoryGroupType } from "@/types/forum";
import ForumCategoryItem from "./ForumCategoryItem";

type Props = {
  group: ForumCategoryGroupType;
  activeCategorySlug: string;
  onSelect?: (categorySlug: string) => void;
};

export default function ForumCategoryGroup({
  group,
  activeCategorySlug,
  onSelect,
}: Props) {
  const isGroupActive = group.categories.some(
    (category) => category.slug === activeCategorySlug,
  );
  const [isOpen, setIsOpen] = useState(isGroupActive);

  return (
    <details
      className="group"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500 transition hover:bg-white/[0.03] hover:text-gray-300">
        {group.name}
        <span className="text-gray-600 transition group-open:rotate-90">›</span>
      </summary>
      <div className="mt-0.5 space-y-px pl-1">
        {group.categories.map((category) => (
          <ForumCategoryItem
            key={category.slug}
            category={category}
            isActive={category.slug === activeCategorySlug}
            onSelect={onSelect}
          />
        ))}
      </div>
    </details>
  );
}
