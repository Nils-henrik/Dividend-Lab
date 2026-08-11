import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";
import { absoluteUrl } from "@/lib/seo/site";

export type JsonLd = Record<string, unknown>;

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DIVLAB_BRAND_NAME,
    url: absoluteUrl("/"),
    inLanguage: "sv-SE",
    description:
      "Svensk plattform för börsnyheter, utbildning, Frihetsmaskinen och community kring långsiktigt sparande.",
  };
}

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DIVLAB_BRAND_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.png"),
    description:
      "DivLab publicerar svensk finansiell information, utbildning och verktyg för långsiktigt sparande.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact"),
      availableLanguage: "Swedish",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function newsArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  updatedAt?: string;
  imageUrl?: string;
  authorName?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.title,
    description: input.description,
    datePublished: input.publishedAt,
    ...(input.updatedAt ? { dateModified: input.updatedAt } : {}),
    mainEntityOfPage: absoluteUrl(input.path),
    url: absoluteUrl(input.path),
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: input.authorName ?? DIVLAB_BRAND_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: DIVLAB_BRAND_NAME,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.png"),
      },
    },
    ...(input.imageUrl
      ? {
          image: [
            input.imageUrl.startsWith("http")
              ? input.imageUrl
              : absoluteUrl(input.imageUrl),
          ],
        }
      : {}),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  authorName?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.updatedAt
      ? { dateModified: input.updatedAt }
      : input.publishedAt
        ? { dateModified: input.publishedAt }
        : {}),
    mainEntityOfPage: absoluteUrl(input.path),
    url: absoluteUrl(input.path),
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: input.authorName ?? DIVLAB_BRAND_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: DIVLAB_BRAND_NAME,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.png"),
      },
    },
    ...(input.imageUrl
      ? {
          image: [
            input.imageUrl.startsWith("http")
              ? input.imageUrl
              : absoluteUrl(input.imageUrl),
          ],
        }
      : {}),
  };
}

export function webApplicationJsonLd(input: {
  name: string;
  description: string;
  path: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SEK",
    },
    provider: {
      "@type": "Organization",
      name: DIVLAB_BRAND_NAME,
      url: absoluteUrl("/"),
    },
  };
}

export function discussionForumPostingJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  authorName?: string;
  commentCount?: number;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: input.title,
    text: input.description,
    url: absoluteUrl(input.path),
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(typeof input.commentCount === "number"
      ? { commentCount: input.commentCount }
      : {}),
    author: {
      "@type": "Person",
      name: input.authorName ?? "DivLab-medlem",
    },
    publisher: {
      "@type": "Organization",
      name: DIVLAB_BRAND_NAME,
      url: absoluteUrl("/"),
    },
  };
}
