import { type NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import {
  RECOVERY_PENDING_COOKIE,
  setRecoveryPendingCookieOptions,
} from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

function resolvePostAuthPath(requestUrl: URL) {
  const type = requestUrl.searchParams.get("type");
  const nextParam = requestUrl.searchParams.get("next");

  if (type === "recovery" || nextParam?.startsWith("/reset-password")) {
    return "/reset-password";
  }

  return getSafeRedirectPath(nextParam);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = resolvePostAuthPath(requestUrl);
  const isPasswordReset = next === "/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const response = NextResponse.redirect(new URL(next, requestUrl.origin));

      if (isPasswordReset) {
        response.cookies.set(
          RECOVERY_PENDING_COOKIE,
          "1",
          setRecoveryPendingCookieOptions(requestUrl.protocol === "https:"),
        );
      }

      return response;
    }
  }

  if (isPasswordReset) {
    return NextResponse.redirect(
      new URL("/reset-password?error=invalid-link", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
