export const RECOVERY_PENDING_COOKIE = "sb-recovery-pending";

export const RECOVERY_CALLBACK_PATH = "/auth/callback/recovery";

export function getRecoveryCallbackUrl(origin: string) {
  return `${origin}${RECOVERY_CALLBACK_PATH}`;
}

export function clearRecoveryPendingCookie() {
  document.cookie = `${RECOVERY_PENDING_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
}

export function markRecoveryPendingCookie() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${RECOVERY_PENDING_COOKIE}=1; Max-Age=900; path=/; SameSite=Lax${secure}`;
}

export function setRecoveryPendingCookieOptions(isSecure: boolean) {
  return {
    path: "/",
    maxAge: 60 * 15,
    sameSite: "lax" as const,
    secure: isSecure,
  };
}
