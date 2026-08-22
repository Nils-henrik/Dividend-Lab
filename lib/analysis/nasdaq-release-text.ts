export const NASDAQ_RELEASE_TEXT_MAX_CHARS = 16_000 as const;

const RELEASE_CONTEXT_ANCHORS = [
  /\bTotal\s+AUM\b/giu,
  /\bFAUM\b/gu,
  /\bfee[- ]generating\s+(?:assets under management|AUM)\b/giu,
  /\bnet asset value\b/giu,
  /\bNAV\b/gu,
  /\bsubstansv[aä]rde\b/giu,
  /\bleverage\b/giu,
] as const;

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/giu, (full, token: string) => {
    if (token.startsWith("#")) {
      const hex = token[1]?.toLowerCase() === "x";
      const raw = token.slice(hex ? 2 : 1);
      const codePoint = Number.parseInt(raw, hex ? 16 : 10);
      if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return full;
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return full;
      }
    }
    return named[token.toLowerCase()] ?? full;
  });
}

function collapseVisibleWhitespace(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/[\t \u00a0\u202f]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeExecutableBlocks(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script>|$)/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?(?:<\/style>|$)/giu, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?(?:<\/noscript>|$)/giu, " ")
    .replace(/<template\b[^>]*>[\s\S]*?(?:<\/template>|$)/giu, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?(?:<\/svg>|$)/giu, " ");
}

type TextRange = { start: number; end: number };

function mergeRanges(ranges: readonly TextRange[]): TextRange[] {
  const sorted = [...ranges]
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: TextRange[] = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || range.start > previous.end + 80) {
      merged.push({ ...range });
      continue;
    }
    previous.end = Math.max(previous.end, range.end);
  }
  return merged;
}

function lastMatchIndex(text: string, pattern: RegExp): number | null {
  pattern.lastIndex = 0;
  let index: number | null = null;
  for (const match of text.matchAll(pattern)) {
    if (typeof match.index === "number") index = match.index;
  }
  pattern.lastIndex = 0;
  return index;
}

/**
 * Keep the global 16k evidence ceiling while avoiding a naive "first 16k"
 * truncation for long financial releases. The ordinary leading excerpt remains
 * the fallback. For supported specialist facts we first retain bounded context
 * around the last explicit NAV/AUM/FAUM/leverage occurrence, which is normally
 * the current report summary rather than an earlier transaction reference. No
 * new network request or financial inference is introduced.
 */
function selectBoundedFinancialContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const contextualRanges: TextRange[] = [];
  for (const pattern of RELEASE_CONTEXT_ANCHORS) {
    const index = lastMatchIndex(text, pattern);
    if (index === null) continue;
    contextualRanges.push({
      start: Math.max(0, index - 550),
      end: Math.min(text.length, index + 1_050),
    });
  }

  const ranges = [
    ...mergeRanges(contextualRanges).sort((a, b) => b.start - a.start),
    { start: 0, end: Math.min(text.length, maxChars) },
  ];

  let output = "";
  for (const range of ranges) {
    const piece = text.slice(range.start, range.end).trim();
    if (!piece) continue;
    const separator = output ? "\n...\n" : "";
    const remaining = maxChars - output.length - separator.length;
    if (remaining <= 0) break;
    output += separator + piece.slice(0, remaining);
  }

  return output.slice(0, maxChars);
}

/**
 * Convert one bounded official Nasdaq disclosure HTML response into inert,
 * visible text. This is deliberately not a browser/DOM execution path. Script,
 * style and embedded vector/template content are discarded before tags are
 * removed. The output remains untrusted external evidence.
 */
export function extractNasdaqReleaseVisibleText(
  html: string,
  maxChars: number = NASDAQ_RELEASE_TEXT_MAX_CHARS,
): string | null {
  if (!html || !Number.isFinite(maxChars) || maxChars <= 0) return null;
  if (!/<(?:!doctype\s+html|html\b|body\b)/iu.test(html)) return null;

  const boundedMaxChars = Math.min(
    Math.floor(maxChars),
    NASDAQ_RELEASE_TEXT_MAX_CHARS,
  );
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/iu)?.[1] ?? html;
  const withoutExecutable = removeExecutableBlocks(body);
  const withLayoutBreaks = withoutExecutable
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/t[dh]\s*>/giu, " | ")
    .replace(/<\/(?:p|div|section|article|header|footer|h[1-6]|li|tr|ul|ol|table)\s*>/giu, "\n")
    .replace(/<(?:p|div|section|article|header|footer|h[1-6]|li|tr|ul|ol|table)\b[^>]*>/giu, "\n");
  const stripped = withLayoutBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(stripped)
    .replace(/\u0000/g, "")
    .replace(/\p{Cf}/gu, "");
  const text = collapseVisibleWhitespace(decoded);
  if (!text) return null;
  return selectBoundedFinancialContext(text, boundedMaxChars);
}
