import { NextResponse } from "next/server";
import { getLearningArticle } from "@/data/learning-articles";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getContentReaderCount,
  isContentReaderType,
  isLikelyBotUserAgent,
  isValidContentSlug,
  recordContentReader,
} from "@/lib/content-readers/server";
import { getNewsArticleBySlug } from "@/lib/news/get-articles";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  contentType?: unknown;
  slug?: unknown;
};

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-vercel-forwarded-for")?.trim() ||
    ""
  );
}

function contentExists(contentType: "news" | "learning", slug: string): boolean {
  return contentType === "news"
    ? Boolean(getNewsArticleBySlug(slug))
    : Boolean(getLearningArticle(slug));
}

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "invalid_request" }, 400);
  }

  if (!isContentReaderType(body.contentType) || !isValidContentSlug(body.slug)) {
    return jsonResponse({ error: "invalid_content" }, 400);
  }

  const { contentType, slug } = body;
  if (!contentExists(contentType, slug)) {
    return jsonResponse({ error: "content_not_found" }, 404);
  }

  const currentCount = async () => ({
    uniqueReaders: await getContentReaderCount(contentType, slug),
  });

  if (process.env.VERCEL_ENV !== "production") {
    return jsonResponse(await currentCount());
  }

  const userAgent = request.headers.get("user-agent")?.trim() ?? "";
  if (!userAgent || isLikelyBotUserAgent(userAgent)) {
    return jsonResponse(await currentCount());
  }

  const user = await getAuthenticatedUser();
  if (user) {
    try {
      const staffRoles = await getStaffRolesForUser(user.id);
      if (staffRoles.length > 0) {
        return jsonResponse(await currentCount());
      }
    } catch {
      // Reader tracking must never break content access if staff lookup fails.
    }
  }

  const ipAddress = resolveClientIp(request);
  if (!ipAddress) {
    return jsonResponse(await currentCount());
  }

  const uniqueReaders = await recordContentReader({
    contentType,
    slug,
    ipAddress,
    userAgent,
  });

  return jsonResponse({ uniqueReaders });
}
