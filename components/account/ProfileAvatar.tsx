"use client";

import { useState } from "react";

type Props = {
  avatarUrl: string | null;
  initials: string;
  sizeClassName?: string;
  textClassName?: string;
  highlighted?: boolean;
  imageAlt?: string;
  fallbackClassName?: string;
};

export default function ProfileAvatar({
  avatarUrl,
  initials,
  sizeClassName = "h-11 w-11",
  textClassName = "text-sm",
  highlighted = false,
  imageAlt = "",
  fallbackClassName,
}: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(avatarUrl) && avatarUrl !== failedUrl;

  const defaultSurfaceClassName = highlighted
    ? "divlab-avatar-highlight-ring"
    : "border border-divlab-border-strong bg-gradient-to-br from-divlab-elevated via-divlab-card to-divlab-bg";

  const surfaceClassName =
    showImage || !fallbackClassName
      ? defaultSurfaceClassName
      : fallbackClassName;

  const avatarContent = (
    <span
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full font-semibold text-divlab-text-secondary ${surfaceClassName} ${textClassName}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl ?? undefined}
          alt={imageAlt}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        initials
      )}
    </span>
  );

  if (!highlighted) {
    return (
      <span className={`relative inline-flex shrink-0 ${sizeClassName}`}>
        {avatarContent}
      </span>
    );
  }

  return (
    <span className={`divlab-avatar-highlight ${sizeClassName}`}>
      {avatarContent}
    </span>
  );
}
