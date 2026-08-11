import type { Metadata } from "next";

/** Explicit HTML robots for private/auth surfaces that must not inherit root index,follow. */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
} as const;

export function noIndexMetadata(title?: string): Metadata {
  return {
    ...(title ? { title } : {}),
    robots: NOINDEX_ROBOTS,
  };
}
