/**
 * Fail-closed classification of changed paths for automatic merge eligibility.
 * Path traversal / unusual spelling must not bypass these checks.
 */

export type SensitiveCategory =
  | "workflows"
  | "supabase"
  | "migrations"
  | "rls-policies"
  | "auth"
  | "middleware"
  | "proxy"
  | "next-config"
  | "package-manifest"
  | "lockfiles"
  | "env-secrets"
  | "credentials-config"
  | "billing"
  | "destructive-scripts"
  | "account-userdata"
  | "security-headers";

export interface SensitivePathMatch {
  path: string;
  category: SensitiveCategory;
}

const CATEGORY_LABELS: Record<SensitiveCategory, string> = {
  workflows: "GitHub Actions workflows (.github/workflows/**)",
  supabase: "Supabase project files (supabase/**)",
  migrations: "Database migrations",
  "rls-policies": "RLS / database policy files",
  auth: "Authentication or authorization code",
  middleware: "Middleware files",
  proxy: "proxy.ts / edge proxy foundations",
  "next-config": "next.config.*",
  "package-manifest": "package.json / dependency manifests",
  lockfiles: "Dependency lockfiles",
  "env-secrets": ".env / secret files",
  "credentials-config": "Secrets or credential configuration",
  billing: "Billing or payment code",
  "destructive-scripts": "Destructive data scripts",
  "account-userdata": "Account deletion or user-data handling",
  "security-headers": "Security headers or access-control foundations",
};

export function getCategoryLabel(category: SensitiveCategory): string {
  return CATEGORY_LABELS[category];
}

/**
 * Normalize a git path for classification.
 * Rejects absolute paths and path-traversal segments (fail closed).
 */
export function normalizeRepoPath(rawPath: string): string | null {
  if (typeof rawPath !== "string") {
    return null;
  }

  let path = rawPath.trim().replace(/\\/g, "/");
  if (path.length === 0) {
    return null;
  }

  // Strip leading ./ segments and trailing slashes
  path = path.replace(/^\.\/+/, "").replace(/\/+$/g, "");

  if (path.startsWith("/") || /^[a-zA-Z]:\//.test(path)) {
    return null;
  }

  if (path.includes("//") || path.split("/").includes("..")) {
    return null;
  }

  // Decode common encodings that could hide sensitive names.
  try {
    const decoded = decodeURIComponent(path);
    if (decoded !== path) {
      return normalizeRepoPath(decoded);
    }
  } catch {
    return null;
  }

  return path.toLowerCase();
}

export function classifyPath(rawPath: string): SensitivePathMatch | null {
  const path = normalizeRepoPath(rawPath);
  if (path === null) {
    // Ambiguous / traversal — treat as blocked under a credentials bucket.
    return {
      path: String(rawPath),
      category: "credentials-config",
    };
  }

  if (path.startsWith(".github/workflows/") || path === ".github/workflows") {
    return { path, category: "workflows" };
  }

  if (path.startsWith("supabase/") || path === "supabase") {
    return { path, category: "supabase" };
  }

  if (
    path.includes("/migrations/") ||
    path.startsWith("migrations/") ||
    /(^|\/)migrate[^/]*$/.test(path) ||
    path.endsWith(".migration.sql") ||
    path.endsWith(".migration.ts") ||
    path.includes("supabase/migrations/")
  ) {
    return { path, category: "migrations" };
  }

  if (
    /(^|\/)(rls|row[_-]?level[_-]?security)(\/|$)/.test(path) ||
    (/policy/.test(path) && /\.(sql|ts|js)$/.test(path)) ||
    path.includes("database-policy") ||
    path.includes("db-policy")
  ) {
    return { path, category: "rls-policies" };
  }

  if (
    path.startsWith("lib/auth/") ||
    path.includes("/auth/") ||
    /(^|\/)(authorization|authentik|authz)(\/|$)/.test(path) ||
    /(^|\/)middleware\/auth/.test(path) ||
    path.endsWith("auth.ts") ||
    path.endsWith("auth.js") ||
    path.includes("require-auth") ||
    path.includes("session-guard")
  ) {
    return { path, category: "auth" };
  }

  if (
    path === "middleware.ts" ||
    path === "middleware.js" ||
    path.endsWith("/middleware.ts") ||
    path.endsWith("/middleware.js") ||
    path.startsWith("middleware/")
  ) {
    return { path, category: "middleware" };
  }

  if (
    path === "proxy.ts" ||
    path === "proxy.js" ||
    path.endsWith("/proxy.ts") ||
    path.endsWith("/proxy.js")
  ) {
    return { path, category: "proxy" };
  }

  if (/^next\.config\.(js|mjs|cjs|ts)$/.test(path)) {
    return { path, category: "next-config" };
  }

  if (
    path === "package.json" ||
    path.endsWith("/package.json") ||
    path === "pnpm-workspace.yaml"
  ) {
    return { path, category: "package-manifest" };
  }

  if (
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|npm-shrinkwrap\.json)$/.test(
      path,
    )
  ) {
    return { path, category: "lockfiles" };
  }

  if (
    /(^|\/)\.env($|\.)/.test(path) ||
    path.endsWith(".env") ||
    path.includes(".env.local") ||
    path.includes(".env.production")
  ) {
    return { path, category: "env-secrets" };
  }

  if (
    path.includes("secrets") ||
    path.includes("credentials") ||
    path.endsWith(".pem") ||
    path.endsWith(".key") ||
    path.includes("service-account") ||
    path.includes("google-services.json") ||
    path === ".npmrc" ||
    path.endsWith("/.npmrc")
  ) {
    return { path, category: "credentials-config" };
  }

  if (
    path.includes("billing") ||
    path.includes("payment") ||
    path.includes("stripe") ||
    (path.includes("checkout") && path.includes("pay"))
  ) {
    return { path, category: "billing" };
  }

  if (
    path.includes("destructive") ||
    path.includes("dangerously-delete") ||
    path.includes("wipe-") ||
    path.includes("drop-all") ||
    path.includes("purge-user") ||
    /(^|\/)scripts\/.*(delete|drop|wipe|purge|destroy)/.test(path)
  ) {
    return { path, category: "destructive-scripts" };
  }

  if (
    path.includes("account-deletion") ||
    path.includes("delete-account") ||
    path.includes("user-data") ||
    path.includes("userdata") ||
    path.includes("gdpr-export") ||
    path.includes("erase-user")
  ) {
    return { path, category: "account-userdata" };
  }

  if (
    path.includes("security-header") ||
    path.includes("content-security-policy") ||
    (path.includes("csp") && path.includes("header")) ||
    path.includes("access-control") ||
    (path.includes("cors") &&
      (path.includes("config") || path.includes("header")))
  ) {
    return { path, category: "security-headers" };
  }

  return null;
}

export function findSensitivePaths(paths: string[]): SensitivePathMatch[] {
  const matches: SensitivePathMatch[] = [];
  const seen = new Set<string>();

  for (const path of paths) {
    const match = classifyPath(path);
    if (!match) {
      continue;
    }
    const key = `${match.category}:${match.path}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    matches.push(match);
  }

  return matches;
}

export function summarizeSensitiveCategories(
  matches: SensitivePathMatch[],
): SensitiveCategory[] {
  return [...new Set(matches.map((match) => match.category))];
}
