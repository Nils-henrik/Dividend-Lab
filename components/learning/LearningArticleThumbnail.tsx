type Props = {
  imageUrl: string;
  /** CSS object-position for object-cover crops. */
  objectPosition?: string;
  /** CSS aspect-ratio for the thumbnail container. */
  aspectRatio?: string;
};

/**
 * Learning library thumbnail.
 * Defaults to the library's 3:2 editorial shape, while individual articles
 * can opt into a wider ratio when the approved cover must remain uncropped.
 */
export default function LearningArticleThumbnail({
  imageUrl,
  objectPosition = "center",
  aspectRatio = "3 / 2",
}: Props) {
  return (
    <div
      className="w-full shrink-0 overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface md:w-[270px]"
      style={{ aspectRatio }}
    >
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
