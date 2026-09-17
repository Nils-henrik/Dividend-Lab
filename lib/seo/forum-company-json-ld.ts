import type { JsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";

type ForumCompanyDirectoryItem = {
  name: string;
  slug: string;
  primaryTicker: string;
};

/** Structured data for the public company directory itself. */
export function forumCompanyDirectoryJsonLd(
  companies: readonly ForumCompanyDirectoryItem[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Bolagsforum – aktier och bolagsdiskussioner",
    description:
      "Utforska svenska och amerikanska bolag i DivLabs forum, filtrera på marknad och index och hitta rätt bolagssida för diskussion.",
    url: absoluteUrl("/forum/bolag"),
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: companies.length,
      itemListElement: companies.map((company, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${company.name} (${company.primaryTicker})`,
        url: absoluteUrl(`/forum/bolag/${company.slug}`),
      })),
    },
  };
}
