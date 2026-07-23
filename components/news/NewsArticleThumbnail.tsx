type Props = {
  imageUrl: string;
  variant?: "row" | "featured";
  /** CSS object-position for object-cover crops. */
  objectPosition?: string;
};

export default function NewsArticleThumbnail({
  imageUrl,
  variant = "row",
  objectPosition = "center",
}: Props) {
  const isFeatured = variant === "featured";

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg border divlab-border-neutral bg-divlab-surface ${
        isFeatured
          ? "aspect-video w-full md:w-[288px]"
          : "h-[96px] w-full md:h-[96px] md:w-[156px]"
      }`}
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
