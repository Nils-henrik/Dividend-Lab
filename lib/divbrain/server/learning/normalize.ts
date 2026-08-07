/**
 * Deterministic Swedish-safe text normalization for Learning retrieval.
 *
 * Handles case, whitespace, punctuation, and light morphology for å/ä/ö.
 * No speculative NLP, spell-check services, or network calls.
 */

/** Unicode letters including Swedish å/ä/ö plus digits. */
const TOKEN_PATTERN = /[A-Za-zÅÄÖåäö0-9]+/g;

const VOWEL_PATTERN = /[aeiouyåäö]/;

/**
 * High-frequency Swedish function words ignored for scoring.
 * Prevents "hur/vad/en/på/man" from inventing relevance.
 */
const STOPWORDS = new Set([
  "a",
  "alla",
  "an",
  "att",
  "av",
  "de",
  "den",
  "det",
  "din",
  "du",
  "e",
  "en",
  "ett",
  "eller",
  "för",
  "från",
  "har",
  "hur",
  "här",
  "i",
  "in",
  "is",
  "jag",
  "kan",
  "man",
  "med",
  "men",
  "min",
  "när",
  "och",
  "of",
  "om",
  "på",
  "sig",
  "sin",
  "ska",
  "som",
  "så",
  "the",
  "to",
  "till",
  "u",
  "vad",
  "var",
  "vi",
  "vilka",
  "vilken",
  "är",
  "å",
]);

/**
 * Normalize Swedish text for lexical comparison.
 * - Unicode NFC
 * - trim + collapse whitespace
 * - lowercase with sv-SE
 * - strip characters outside letters/digits/whitespace (keeps å/ä/ö)
 */
export function normalizeDivBrainLearningText(value: string): string {
  const nfc = value.normalize("NFC");
  const lowered = nfc.toLocaleLowerCase("sv-SE");
  const stripped = lowered.replace(/[^\p{L}\p{N}\s]+/gu, " ");
  return stripped.replace(/\s+/g, " ").trim();
}

/**
 * Light deterministic stem for Swedish matching.
 * Conservative: prefer no stem over speculative verb/root mutilation.
 */
export function stemDivBrainLearningToken(token: string): string {
  if (token.length < 5) {
    return token;
  }

  // Definite singular/plural-ish endings on longer tokens only.
  for (const suffix of ["erna", "orna", "arna", "heterna", "ningarna"] as const) {
    if (token.length - suffix.length >= 5 && token.endsWith(suffix)) {
      return token.slice(0, token.length - suffix.length);
    }
  }

  // sparkvoten → sparkvot (avoid stripping "en" from shorter words like "pension")
  if (token.length >= 8 && (token.endsWith("en") || token.endsWith("et"))) {
    const stem = token.slice(0, -2);
    const last = stem[stem.length - 1];
    if (stem.length >= 5 && last && !VOWEL_PATTERN.test(last)) {
      return stem;
    }
  }

  // aktier → aktie (vowel + er, strip trailing r)
  if (token.length >= 6 && /[aeiouyåäö]er$/.test(token)) {
    return token.slice(0, -1);
  }

  // indexfonder → indexfond (long consonant + er plurals)
  if (token.length >= 8 && /[^aeiouyåäö]er$/.test(token)) {
    return token.slice(0, -2);
  }

  return token;
}

function isStopword(token: string): boolean {
  return STOPWORDS.has(token);
}

/**
 * Tokenize normalized text into ordered unique content stems.
 * Stopwords are dropped so they cannot invent relevance.
 */
export function tokenizeDivBrainLearningText(value: string): string[] {
  const normalized = normalizeDivBrainLearningText(value);
  if (!normalized) {
    return [];
  }

  const raw = normalized.match(TOKEN_PATTERN) ?? [];
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const token of raw) {
    if (isStopword(token)) {
      continue;
    }
    const stemmed = stemDivBrainLearningToken(token);
    if (isStopword(stemmed) || seen.has(stemmed)) {
      continue;
    }
    seen.add(stemmed);
    tokens.push(stemmed);
  }

  return tokens;
}

/**
 * Build a multiset frequency map of tokens (deterministic insertion order).
 */
export function tokenFrequencyMap(
  tokens: readonly string[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) ?? 0) + 1);
  }
  return map;
}

/**
 * Count how many times `needle` tokens appear in `haystack` frequency map.
 * Caps each query token contribution at the haystack count.
 */
export function countTokenOverlap(
  queryTokens: readonly string[],
  haystackFreq: ReadonlyMap<string, number>,
): number {
  if (queryTokens.length === 0 || haystackFreq.size === 0) {
    return 0;
  }

  const remaining = new Map(haystackFreq);
  let matches = 0;

  for (const token of queryTokens) {
    const available = remaining.get(token) ?? 0;
    if (available > 0) {
      matches += 1;
      remaining.set(token, available - 1);
    }
  }

  return matches;
}

/**
 * Unique query tokens that also appear in the haystack.
 */
export function matchedUniqueQueryTokens(
  queryTokens: readonly string[],
  haystackTokens: readonly string[],
): number {
  if (queryTokens.length === 0 || haystackTokens.length === 0) {
    return 0;
  }

  const haystack = new Set(haystackTokens);
  const seen = new Set<string>();
  let count = 0;

  for (const token of queryTokens) {
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    if (haystack.has(token)) {
      count += 1;
    }
  }

  return count;
}
