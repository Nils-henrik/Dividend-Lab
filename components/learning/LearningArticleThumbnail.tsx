type Props = {
  imageUrl: string;
  /** CSS object-position for object-cover crops. */
  objectPosition?: string;
};

/**
 * Compact Learning list thumbnail.
 * Taller than the shared news row crop on mobile so embedded editorial
 * cover headlines remain readable, while keeping a compact desktop chip.
 */
export default function LearningArticleThumbnail({
  imageUrl,
  objectPosition = "center",
}: Props) {
  return (
    <div className="h-[168px] w-full shrink-0 overflow-hidden rounded-lg border divlab-border-neutral bg-divlab-surface md:h-[96px] md:w-[156px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        style={{ objectPosition }}
      />
    </div>
  );
}
