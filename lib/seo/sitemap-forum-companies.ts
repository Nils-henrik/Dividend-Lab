type SitemapEntry = {
  url: string;
  lastModified?: Date;
};

/**
 * Company detail routes are intentionally excluded while they only contain
 * placeholder copy ("Bolagsdiskussioner kommer snart"). The directory itself
 * remains indexable at /forum/bolag. Re-enable detail sitemap entries only when
 * company-specific public content is available and the detail metadata policy
 * is changed back to indexable at the same time.
 */
export function listActiveForumCompanySitemapEntries(): SitemapEntry[] {
  return [];
}
