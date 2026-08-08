/**
 * Deterministic Swedish-safe text normalization for Learning retrieval.
 *
 * Handles case, whitespace, punctuation, light morphology and a deliberately
 * small set of finance-domain equivalences for å/ä/ö. No speculative NLP,
 * spell-check services, embeddings, models or network calls.
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
 * Narrow, symmetric finance-domain equivalences.
 *
 * These are intentionally limited to established abbreviations or genuinely
 * equivalent Swedish terms. Related-but-not-equivalent concepts are excluded
 * so retrieval does not become eager or advisory.
 */
const FINANCE_TOKEN_EQUIVALENTS: Readonly<Record<string, readonly string[]>> = {
  riskspridning: ["diversifiering"],
  diversifiering: ["riskspridning"],
  investeringssparkonto: ["isk"],
  isk: ["investeringssparkonto"],
  kapitalförsäkring: ["kf"],
  kf: ["kapitalförsäkring"],
  premiepension: ["ppm"],
  ppm: ["premiepension"],
  fondavgift: ["förvaltningsavgift"],
  förvaltningsavgift: ["fondavgift"],
  utdelningsavkastning: ["direktavkastning"],
  direktavkastning: ["utdelningsavkastning"],
  aktieutdelning: ["utdelning"],
  utdelning: ["aktieutdelning"],
};

/**
 * Normalize Swedish text for lexical comparison.
 * - Unicode NFC
 * - trim + collapse whitespace
 * - lowercase with sv-SE
 * - normalize common finance notation before punctuation stripping
 * - strip characters outside letters/digits/whitespace (keeps å/ä/ö)
 */
export function normalizeDivBrainLearningText(value: string): string {
  const nfc = value.normalize("NFC");
  const lowered = nfc.toLocaleLowerCase("sv-SE");
  const financeNotation = lowered
    .replace(/\bp\s*\/\s*e\b/gu, " pe ")
    .replace(/\bp\s*\/\s*s\b/gu, " ps ");
  const stripped = financeNotation.replace(/[^\p{L}\p{N}\s]+/gu, " ");
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
 * Expand already-tokenized user-query terms with established finance-domain
 * equivalents. Original tokens always remain first and are never removed.
 *
 * This is query-only expansion: corpus metadata remains canonical, and callers
 * can keep exposing the original query tokens for diagnostics.
 */
export function expandDivBrainLearningQueryTokens(
  queryTokens: readonly string[],
): string[] {
  const seen = new Set<string>();
  const expanded: string[] = [];

  const add = (token: string) => {
    const stemmed = stemDivBrainLearningToken(token);
    if (!stemmed || isStopword(stemmed) || seen.has(stemmed)) {
      return;
    }
    seen.add(stemmed);
    expanded.push(stemmed);
  };

  for (const token of queryTokens) {
    add(token);
  }

  for (const token of queryTokens) {
    for (const equivalent of FINANCE_TOKEN_EQUIVALENTS[token] ?? []) {
      add(equivalent);
    }
  }

  return expanded;
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
 * Count conservative Swedish compound-prefix matches for query terms that did
 * not already match exactly. Only long terms qualify, which avoids turning
 * short generic words such as "fond" or "aktie" into broad fuzzy matches.
 *
 * Example: `utdelning` can match `utdelningssäkerhet`.
 */
export function countLongCompoundTokenOverlap(
  queryTokens: readonly string[],
  fieldTokens: readonly string[],
): number {
  if (queryTokens.length === 0 || fieldTokens.length === 0) {
    return 0;
  }

  const fieldSet = new Set(fieldTokens);
  const usedFieldTokens = new Set<string>();
  let matches = 0;

  for (const queryToken of queryTokens) {
    if (queryToken.length < 7 || fieldSet.has(queryToken)) {
      continue;
    }

    const compound = fieldTokens.find(
      (fieldToken) =>
        !usedFieldTokens.has(fieldToken) &&
        fieldToken.length > queryToken.length &&
        fieldToken.startsWith(queryToken),
    );

    if (compound) {
      usedFieldTokens.add(compound);
      matches += 1;
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
