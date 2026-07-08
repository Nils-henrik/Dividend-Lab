import { type NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const isPasswordReset = next.startsWith("/reset-password");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  if (isPasswordReset) {
    return NextResponse.redirect(
      new URL("/reset-password?error=invalid-link", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
