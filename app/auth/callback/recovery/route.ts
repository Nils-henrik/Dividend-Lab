import { type NextRequest, NextResponse } from "next/server";
import {
  RECOVERY_PENDING_COOKIE,
  setRecoveryPendingCookieOptions,
} from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/reset-password?error=invalid-link", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/reset-password?error=invalid-link", requestUrl.origin),
    );
  }

  const response = NextResponse.redirect(
    new URL("/reset-password", requestUrl.origin),
  );

  response.cookies.set(
    RECOVERY_PENDING_COOKIE,
    "1",
    setRecoveryPendingCookieOptions(requestUrl.protocol === "https:"),
  );

  return response;
}
