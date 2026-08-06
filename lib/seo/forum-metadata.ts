import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export function buildForumMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = getCanonicalUrl(input.path);
  const absoluteTitle = `${input.title} | ${DIVLAB_BRAND_NAME}`;

  return {
    title: {
      absolute: absoluteTitle,
    },
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: absoluteTitle,
      description: input.description,
      url: canonical,
      type: "website",
      locale: "sv_SE",
    },
  };
}
