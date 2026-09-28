export function selectOwnershipSnapshot<T extends { asOf: string | null; capitalPct: number }>(
  items: readonly T[],
): { asOf: string | null; items: T[] } {
  if (items.length === 0) return { asOf: null, items: [] };
  const dated = items.filter((item) => item.asOf);
  if (dated.length === 0) {
    return {
      asOf: null,
      items: [...items].sort((left, right) => right.capitalPct - left.capitalPct),
    };
  }
  const asOf = dated.map((item) => item.asOf as string).sort().at(-1) ?? null;
  return {
    asOf,
    items: dated
      .filter((item) => item.asOf === asOf)
      .sort((left, right) => right.capitalPct - left.capitalPct),
  };
}
