export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

export function getSafeRedirectPath(value?: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  // Match the URL parser used by auth callbacks: it normalizes dot segments,
  // backslashes and control characters before resolving a destination.
  const base = "https://divlab.invalid";
  let target: URL;
  try {
    target = new URL(value, base);
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  if (
    target.origin !== base ||
    target.pathname.startsWith("/login") ||
    target.pathname.startsWith("/register")
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  return `${target.pathname}${target.search}${target.hash}`;
}
