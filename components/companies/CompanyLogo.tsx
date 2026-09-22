"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  name: string;
  logoPath: string | null;
  size?: "compact" | "large";
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("sv");
}

export default function CompanyLogo({
  name,
  logoPath,
  size = "large",
}: Props) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const showLogo = Boolean(logoPath && logoPath !== failedPath);
  const dimensions = size === "large" ? "h-20 w-20" : "h-12 w-12";

  return (
    <span
      className={`relative flex ${dimensions} shrink-0 items-center justify-center overflow-hidden rounded-2xl border divlab-border-neutral bg-divlab-surface shadow-sm`}
      aria-hidden="true"
    >
      {showLogo ? (
        <Image
          src={logoPath ?? ""}
          alt=""
          width={80}
          height={80}
          className="h-full w-full object-contain p-3"
          onError={() => setFailedPath(logoPath)}
        />
      ) : (
        <span className="text-lg font-semibold tracking-[-0.04em] text-divlab-blue">
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}

