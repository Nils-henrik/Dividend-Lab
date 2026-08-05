import type { CSSProperties } from "react";

/** Tailwind class pair for responsive object-position via CSS variables. */
export const RESPONSIVE_THUMBNAIL_POSITION_CLASS =
  "[object-position:var(--thumb-pos-mobile)] md:[object-position:var(--thumb-pos-desktop)]";

type PositionInput = {
  desktop?: string;
  mobile?: string;
  fallbackDesktop?: string;
};

/** Inline style vars for {@link RESPONSIVE_THUMBNAIL_POSITION_CLASS}. */
export function getResponsiveThumbnailPositionStyle({
  desktop,
  mobile,
  fallbackDesktop = "center",
}: PositionInput): CSSProperties {
  const desktopPosition = desktop ?? fallbackDesktop;
  const mobilePosition = mobile ?? desktopPosition;

  return {
    "--thumb-pos-mobile": mobilePosition,
    "--thumb-pos-desktop": desktopPosition,
  } as CSSProperties;
}
