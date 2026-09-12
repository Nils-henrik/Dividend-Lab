const PLACEHOLDER_PATTERNS: readonly RegExp[] = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bTBD\b/i,
  /\bXXX\b/,
  /\blorem ipsum\b/i,
  /\[\s*(insert|placeholder|title|rubrik|text|todo)\s*\]/i,
  /\{\{\s*[^}]+\s*\}\}/,
  /\byour title here\b/i,
  /\binsert (title|text|summary|headline)\b/i,
  /\bplaceholder\b/i,
];

export function isObviousPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function collectPlaceholderHits(
  value: string,
  path: string,
): { path: string; excerpt: string }[] {
  if (!isObviousPlaceholder(value)) {
    return [];
  }

  return [{ path, excerpt: value.trim().slice(0, 80) }];
}
