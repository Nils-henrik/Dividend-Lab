export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

export function getSafeRedirectPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  if (value.startsWith("/login") || value.startsWith("/register")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  return value;
}
