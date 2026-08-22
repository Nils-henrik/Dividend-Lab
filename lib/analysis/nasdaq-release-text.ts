export const NASDAQ_RELEASE_TEXT_MAX_CHARS = 16_000 as const;

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
  return text.slice(0, Math.floor(maxChars));
}
