export function getSiteUrlFromEnv() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export async function getRequestOrigin() {
  const { headers } = await import("next/headers");
  const headerList = await headers();
  const origin = headerList.get("origin");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? undefined;
  const protocol = headerList.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${protocol}://${host}`.replace(/\/$/, "");
  }

  return getSiteUrlFromEnv();
}
