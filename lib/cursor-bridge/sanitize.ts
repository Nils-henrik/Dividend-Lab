/**
 * Sanitize API / workflow error text before posting to GitHub or logs.
 * Never allow secrets, Authorization headers, or raw response dumps through.
 */

const REDACTION = "[REDACTED]";

const SENSITIVE_PATTERNS: RegExp[] = [
  /authorization\s*[:=]\s*bearer\s+\S+/gi,
  /authorization\s*[:=]\s*basic\s+\S+/gi,
  /bearer\s+[a-z0-9._\-+=/]{8,}/gi,
  /basic\s+[a-z0-9=+/]{8,}/gi,
  /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{20,}\b/g,
  /\bgithub_pat_[a-zA-Z0-9_]{20,}\b/g,
  /\bsk-[a-zA-Z0-9]{20,}\b/g,
  /\bkey_[a-zA-Z0-9]{20,}\b/g,
  /\bCURSOR_API_KEY\b\s*[:=]\s*\S+/gi,
  /\bapi[_-]?key\b\s*[:=]\s*\S+/gi,
  /\btoken\b\s*[:=]\s*\S+/gi,
  /\bpassword\b\s*[:=]\s*\S+/gi,
  /\bsecret\b\s*[:=]\s*\S+/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

export function sanitizeErrorMessage(
  input: unknown,
  options?: { maxLength?: number },
): string {
  const maxLength = options?.maxLength ?? 800;
  let text = normalizeToString(input);

  for (const pattern of SENSITIVE_PATTERNS) {
    text = text.replace(pattern, REDACTION);
  }

  // Collapse huge JSON blobs / stack dumps that may contain headers.
  text = text.replace(/\s+/g, " ").trim();

  if (text.length === 0) {
    return "Unknown error (empty message after sanitization)";
  }

  if (text.length > maxLength) {
    return `${text.slice(0, maxLength)}…`;
  }

  return text;
}

export function containsSecretLikeValue(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

function normalizeToString(input: unknown): string {
  if (input == null) {
    return "";
  }
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof Error) {
    return input.message;
  }
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}
