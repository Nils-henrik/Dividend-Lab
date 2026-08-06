const REDACTION_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /Bearer\s+[A-Za-z0-9._\-+/=]+/gi, replacement: "Bearer [REDACTED]" },
  { pattern: /Basic\s+[A-Za-z0-9._\-+/=]+/gi, replacement: "Basic [REDACTED]" },
  {
    pattern: /Authorization:\s*[^\s]+/gi,
    replacement: "Authorization: [REDACTED]",
  },
  { pattern: /CURSOR_API_KEY[=:\s]+[^\s]+/gi, replacement: "CURSOR_API_KEY=[REDACTED]" },
  { pattern: /ghp_[A-Za-z0-9]+/g, replacement: "ghp_[REDACTED]" },
  { pattern: /github_pat_[A-Za-z0-9_]+/g, replacement: "github_pat_[REDACTED]" },
  { pattern: /sk-[A-Za-z0-9]{8,}/g, replacement: "sk-[REDACTED]" },
  { pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: "[REDACTED_JWT]" },
];

const MAX_SANITIZED_LENGTH = 2000;

/**
 * Sanitize Cursor API / HTTP error text before posting to GitHub.
 */
export function sanitizeApiError(input: unknown): string {
  let text: string;
  if (typeof input === "string") {
    text = input;
  } else if (input instanceof Error) {
    text = input.message;
  } else {
    try {
      text = JSON.stringify(input);
    } catch {
      text = "Unknown error";
    }
  }

  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    text = text.replace(pattern, replacement);
  }

  if (text.length > MAX_SANITIZED_LENGTH) {
    text = `${text.slice(0, MAX_SANITIZED_LENGTH)}… [truncated]`;
  }

  return text;
}

export function containsRedactedSecrets(text: string): boolean {
  const sanitized = sanitizeApiError(text);
  return sanitized.includes("[REDACTED]");
}
