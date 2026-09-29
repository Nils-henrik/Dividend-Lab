const MAX_PEERS = 8;

export function sectorPeers<T extends { slug: string; sector: string }>(
  company: T,
  companies: readonly T[],
  limit = 6,
): T[] {
  const sector = company.sector.trim();
  if (!sector) return [];
  const cap = Math.min(MAX_PEERS, Math.max(1, limit));
  return companies
    .filter((item) => item.slug !== company.slug && item.sector === sector)
    .sort((left, right) => left.slug.localeCompare(right.slug, "sv"))
    .slice(0, cap);
}
