import type { SensitivePathMatch } from "./types";

type PathRule = {
  category: string;
  test: (normalizedPath: string) => boolean;
};

function normalizeChangedPath(path: string): string {
  const trimmed = path.trim().replace(/\\/g, "/");
  const withoutLeading = trimmed.replace(/^\/+/, "");
  const segments = withoutLeading.split("/").filter((segment) => segment !== "." && segment !== "");

  if (segments.some((segment) => segment === "..")) {
    return "__invalid_traversal__";
  }

  return segments.join("/");
}

const PATH_RULES: PathRule[] = [
  {
    category: "GitHub Actions workflows",
    test: (p) => p === ".github/workflows" || p.startsWith(".github/workflows/"),
  },
  {
    category: "Supabase configuration and data layer",
    test: (p) => p === "supabase" || p.startsWith("supabase/"),
  },
  {
    category: "Database migrations",
    test: (p) => p.includes("/migrations/") || p.startsWith("migrations/"),
  },
  {
    category: "RLS or database policy files",
    test: (p) =>
      /(^|\/)(rls|policies|row-level-security)(\/|$)/i.test(p) ||
      /policy/i.test(p) && (p.endsWith(".sql") || p.endsWith(".ts")),
  },
  {
    category: "Authentication or authorization code",
    test: (p) =>
      /(^|\/)(auth|authorization|permissions)(\/|$)/i.test(p) ||
      /(^|\/)auth[-_.]/i.test(p) ||
      /authorize/i.test(p),
  },
  {
    category: "Middleware",
    test: (p) => p === "middleware.ts" || p.endsWith("/middleware.ts"),
  },
  {
    category: "Proxy configuration",
    test: (p) => p === "proxy.ts" || p.endsWith("/proxy.ts"),
  },
  {
    category: "Next.js configuration",
    test: (p) => p === "next.config.ts" || p.endsWith("/next.config.ts"),
  },
  {
    category: "Package manifest",
    test: (p) => p === "package.json" || p.endsWith("/package.json"),
  },
  {
    category: "Dependency lockfile",
    test: (p) =>
      p === "package-lock.json" ||
      p === "pnpm-lock.yaml" ||
      p === "yarn.lock" ||
      p === "bun.lockb" ||
      p.endsWith("/package-lock.json") ||
      p.endsWith("/pnpm-lock.yaml") ||
      p.endsWith("/yarn.lock") ||
      p.endsWith("/bun.lockb"),
  },
  {
    category: "Environment or secrets file",
    test: (p) =>
      p.startsWith(".env") ||
      p.includes("/.env") ||
      /(^|\/)\.env(\.|$)/.test(p),
  },
  {
    category: "Secrets or credential configuration",
    test: (p) =>
      /(^|\/)(secrets?|credentials?)(\/|$)/i.test(p) ||
      /secret/i.test(p) ||
      /credential/i.test(p),
  },
  {
    category: "Billing or payment code",
    test: (p) =>
      /(^|\/)(billing|payment|payments|stripe)(\/|$)/i.test(p) ||
      /billing/i.test(p) ||
      /payment/i.test(p),
  },
  {
    category: "Destructive data script",
    test: (p) =>
      p.startsWith("scripts/") &&
      /(delete|drop|truncate|wipe|destroy)/i.test(p),
  },
  {
    category: "Account deletion or user-data handling",
    test: (p) =>
      /delete[-_]?account/i.test(p) ||
      /account[-_]?deletion/i.test(p) ||
      /user[-_]?data/i.test(p),
  },
  {
    category: "Security headers or access-control foundations",
    test: (p) =>
      /security[-_]?headers/i.test(p) ||
      /(^|\/)(csp|access-control)(\/|$)/i.test(p) ||
      p.includes("content-security-policy"),
  },
];

export function classifySensitivePaths(paths: string[]): SensitivePathMatch[] {
  const matches: SensitivePathMatch[] = [];
  const seen = new Set<string>();

  for (const rawPath of paths) {
    const normalized = normalizeChangedPath(rawPath);

    if (normalized === "__invalid_traversal__") {
      const key = "invalid_traversal::" + rawPath;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          category: "Invalid or traversal path",
          path: rawPath,
        });
      }
      continue;
    }

    for (const rule of PATH_RULES) {
      if (rule.test(normalized)) {
        const key = `${rule.category}::${normalized}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({ category: rule.category, path: normalized });
        }
        break;
      }
    }
  }

  return matches;
}

export function hasSensitivePaths(paths: string[]): boolean {
  return classifySensitivePaths(paths).length > 0;
}

export function summarizeSensitiveCategories(matches: SensitivePathMatch[]): string[] {
  return [...new Set(matches.map((m) => m.category))].sort();
}
