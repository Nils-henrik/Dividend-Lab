import type { NewsArticle } from "@/types/news";
import { parseCanonicalArticlePath } from "./path-contract";
import type { EditorialSeries } from "./types";

export const AUTOREDAKTION_PRODUCTION_STATUS_CONTEXT =
  "autoredaktion/production";

const MANAGED_MERGE_MESSAGE =
  /^Autoredaktion: merge managed publication PR #(\d+)\b/m;

export type CommitStatusLike = {
  context: string;
  state: string;
  target_url?: string | null;
  updated_at?: string | null;
};

export type VercelObservation = {
  state: "missing" | "pending" | "success" | "failure";
  targetUrl: string | null;
};

export function managedPrNumberFromMergeMessage(message: string): number | null {
  const match = MANAGED_MERGE_MESSAGE.exec(message);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function observeVercelStatus(
  statuses: readonly CommitStatusLike[],
): VercelObservation {
  const candidates = statuses
    .filter((status) => status.context.trim().toLowerCase() === "vercel")
    .slice()
    .sort((a, b) =>
      String(a.updated_at ?? "").localeCompare(String(b.updated_at ?? "")),
    );

  const latest = candidates.at(-1);
  if (!latest) return { state: "missing", targetUrl: null };

  const state = latest.state.trim().toLowerCase();
  if (state === "success") {
    return { state: "success", targetUrl: latest.target_url ?? null };
  }
  if (state === "failure" || state === "error") {
    return { state: "failure", targetUrl: latest.target_url ?? null };
  }
  return { state: "pending", targetUrl: latest.target_url ?? null };
}

export function canonicalArticleUrl(
  article: Pick<NewsArticle, "slug">,
  origin = "https://divlab.se",
): string {
  if (!article.slug) throw new Error("Managed article must have a slug");
  return `${origin.replace(/\/$/, "")}/news/${article.slug}`;
}

export function canonicalImageUrl(
  article: Pick<NewsArticle, "imageUrl">,
  origin = "https://divlab.se",
): string | null {
  if (!article.imageUrl) return null;
  if (/^https?:\/\//i.test(article.imageUrl)) return article.imageUrl;
  return `${origin.replace(/\/$/, "")}${article.imageUrl.startsWith("/") ? "" : "/"}${article.imageUrl}`;
}

export function buildAutoredaktionXCopy(
  article: Pick<NewsArticle, "title" | "slug">,
  series: EditorialSeries,
  origin = "https://divlab.se",
): string {
  const url = canonicalArticleUrl(article, origin);
  const lead =
    series === "borssverige"
      ? `Dagens #BörsSverige är live: ${article.title}. Läs hela genomgången på DivLab:`
      : series === "norden-i-centrum"
        ? `Dagens #NordenICentrum är live: ${article.title}. Läs den nordiska morgongenomgången på DivLab:`
        : series === "bolaget-i-fokus"
          ? `Dagens #BolagetIFokus är live: ${article.title}. Läs hela bolagsgenomgången på DivLab:`
          : `Dagens #USAiFokus är live: ${article.title}. Läs USA-genomgången på DivLab:`;
  const maxLeadLength = Math.max(32, 275 - url.length);
  const clipped =
    lead.length <= maxLeadLength
      ? lead
      : `${lead.slice(0, Math.max(0, maxLeadLength - 1)).trimEnd()}…`;
  return `${clipped} ${url}`;
}

export function seriesFromManagedArticlePath(path: string): EditorialSeries | null {
  return parseCanonicalArticlePath(path)?.series ?? null;
}
