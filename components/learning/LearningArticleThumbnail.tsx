type Props = {
  imageUrl: string;
  /** CSS object-position for object-cover crops. */
  objectPosition?: string;
};

/**
 * Learning library thumbnail.
 * Covers use their native 3:2 editorial shape so embedded headlines remain
 * readable instead of being compressed into a small desktop chip.
 */
export default function LearningArticleThumbnail({
  imageUrl,
  objectPosition = "center",
}: Props) {
  return (
    <div className="aspect-[3/2] w-full shrink-0 overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface md:w-[270px]">
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
