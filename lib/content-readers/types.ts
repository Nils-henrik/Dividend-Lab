export type ContentReaderType = "news" | "learning";

export type ContentReaderCountMap = Record<string, number>;

export function formatUniqueReaderLabel(count: number): string {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return safeCount === 1 ? "1 unik läsare" : `${safeCount.toLocaleString("sv-SE")} unika läsare`;
}
