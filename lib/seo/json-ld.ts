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

export function modelPortfolioCollectionJsonLd(
  portfolios: readonly { name: string; slug: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "DivLabs AI-portföljer",
    description:
      "Fyra transparenta och simulerade AI-portföljer med aktuella innehav, affärer och kassaflödesjusterade resultat.",
    url: absoluteUrl("/portfolios"),
    inLanguage: "sv-SE",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: portfolios.length,
      itemListElement: portfolios.map((portfolio, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: portfolio.name,
        url: absoluteUrl(`/portfolios/${portfolio.slug}`),
      })),
    },
  };
}

export function webPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
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
    dateModified: input.updatedAt ?? input.publishedAt,
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

type DiscussionForumCommentJsonLdInput = {
  text: string;
  datePublished: string;
  authorName?: string;
  authorPath?: string;
};

export function discussionForumPostingJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  authorName?: string;
  authorPath?: string;
  comments?: DiscussionForumCommentJsonLdInput[];
}): JsonLd {
  const comments = input.comments ?? [];

  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: input.title,
    text: input.description,
    datePublished: input.datePublished,
    mainEntityOfPage: absoluteUrl(input.path),
    url: absoluteUrl(input.path),
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
    commentCount: comments.length,
    author: {
      "@type": "Person",
      name: input.authorName ?? "DivLab-medlem",
      ...(input.authorPath ? { url: absoluteUrl(input.authorPath) } : {}),
    },
    ...(comments.length > 0
      ? {
          comment: comments.map((comment) => ({
            "@type": "Comment",
            text: comment.text,
            datePublished: comment.datePublished,
            author: {
              "@type": "Person",
              name: comment.authorName ?? "DivLab-medlem",
              ...(comment.authorPath
                ? { url: absoluteUrl(comment.authorPath) }
                : {}),
            },
          })),
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: DIVLAB_BRAND_NAME,
      url: absoluteUrl("/"),
    },
  };
}
