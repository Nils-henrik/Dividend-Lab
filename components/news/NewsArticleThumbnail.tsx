type Props = {
  imageUrl: string;
  variant?: "row" | "featured";
};

export default function NewsArticleThumbnail({
  imageUrl,
  variant = "row",
}: Props) {
  const isFeatured = variant === "featured";

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg border divlab-border-neutral bg-divlab-surface ${
        isFeatured
          ? "h-[104px] w-full sm:h-[100px] md:h-[104px] md:w-[168px]"
          : "h-[96px] w-full md:h-[96px] md:w-[156px]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
