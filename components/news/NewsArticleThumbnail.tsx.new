import Image from "next/image";
import {
  getResponsiveThumbnailPositionStyle,
  RESPONSIVE_THUMBNAIL_POSITION_CLASS,
} from "@/lib/news/thumbnail-position";

type Props = {
  imageUrl: string;
  variant?: "row" | "featured";
  /** CSS object-position for object-cover crops at `md` and above. */
  objectPosition?: string;
  /** Mobile-only object-position; falls back to `objectPosition`. */
  mobileObjectPosition?: string;
  priority?: boolean;
};

export default function NewsArticleThumbnail({
  imageUrl,
  variant = "row",
  objectPosition,
  mobileObjectPosition,
  priority = false,
}: Props) {
  const isFeatured = variant === "featured";
  const fallbackDesktop = isFeatured ? "center 40%" : "center 50%";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border divlab-border-neutral bg-divlab-surface ${
        isFeatured
          ? "aspect-video w-full md:w-[288px]"
          : "aspect-video w-full md:w-[176px]"
      }`}
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        priority={priority}
        sizes={
          isFeatured
            ? "(max-width: 768px) 100vw, 288px"
            : "(max-width: 768px) 100vw, 176px"
        }
        className={`object-cover ${RESPONSIVE_THUMBNAIL_POSITION_CLASS}`}
        style={getResponsiveThumbnailPositionStyle({
          desktop: objectPosition,
          mobile: mobileObjectPosition,
          fallbackDesktop,
        })}
      />
    </div>
  );
}
