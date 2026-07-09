import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { RECOVERY_PENDING_COOKIE } from "@/lib/auth/recovery";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;
  const recoveryPending =
    request.cookies.get(RECOVERY_PENDING_COOKIE)?.value === "1";

  if (
    recoveryPending &&
    pathname !== "/reset-password" &&
    !pathname.startsWith("/auth/")
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/reset-password";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}
