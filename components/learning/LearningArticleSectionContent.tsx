type ListProps = {
  items: string[];
  ordered?: boolean;
};

function LearningArticleList({ items, ordered = false }: ListProps) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag
      className={
        ordered
          ? "list-decimal space-y-2 pl-5 text-base leading-7 text-divlab-text-secondary"
          : "list-disc space-y-2 pl-5 text-base leading-7 text-divlab-text-secondary marker:text-divlab-blue/70"
      }
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ListTag>
  );
}

type SectionContentProps = {
  intro?: string[];
  paragraphs?: string[];
  bullets?: string[];
  numberedItems?: string[];
  paragraphsAfterLists?: string[];
};

export function LearningArticleSectionContent({
  intro,
  paragraphs,
  bullets,
  numberedItems,
  paragraphsAfterLists,
}: SectionContentProps) {
  return (
    <>
      {intro?.map((paragraph) => (
        <p key={paragraph} className="text-base leading-7 text-divlab-text-secondary">
          {paragraph}
        </p>
      ))}

      {paragraphs?.map((paragraph) => (
        <p key={paragraph} className="text-base leading-7 text-divlab-text-secondary">
          {paragraph}
        </p>
      ))}

      {bullets && bullets.length > 0 && <LearningArticleList items={bullets} />}

      {numberedItems && numberedItems.length > 0 && (
        <LearningArticleList items={numberedItems} ordered />
      )}

      {paragraphsAfterLists?.map((paragraph) => (
        <p key={paragraph} className="text-base leading-7 text-divlab-text-secondary">
          {paragraph}
        </p>
      ))}
    </>
  );
}

type SubsectionProps = {
  subheading: string;
  paragraphs?: string[];
  bullets?: string[];
  numberedItems?: string[];
  paragraphsAfterLists?: string[];
};

export function LearningArticleSubsectionContent({
  subheading,
  paragraphs,
  bullets,
  numberedItems,
  paragraphsAfterLists,
}: SubsectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divlab-text">{subheading}</h3>
      <LearningArticleSectionContent
        paragraphs={paragraphs}
        bullets={bullets}
        numberedItems={numberedItems}
        paragraphsAfterLists={paragraphsAfterLists}
      />
    </div>
  );
}
