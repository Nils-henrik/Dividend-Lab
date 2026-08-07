import { cache } from "react";
import { redirect } from "next/navigation";
import { mapSupabaseUser } from "@/lib/auth/user";
import { getUserDisplayIdentity } from "@/lib/profiles/identity";
import { ensureProfileForUser } from "@/lib/profiles/profile";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUserUncached() {
  if (!tryGetSupabaseConfig()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user ? mapSupabaseUser(user) : null;
  } catch {
    return null;
  }
}

/**
 * Request-scoped memoization prevents layouts and pages from repeating the same
 * Supabase auth lookup during one server render. React clears this cache between
 * requests, so authentication state is never shared between visitors.
 */
export const getAuthenticatedUser = cache(getAuthenticatedUserUncached);

async function requireAuthenticatedUserUncached() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export const requireAuthenticatedUser = cache(requireAuthenticatedUserUncached);

async function requireAuthenticatedUserWithProfileUncached() {
  const user = await requireAuthenticatedUser();
  const profile = await ensureProfileForUser(user.id);
  const identity = getUserDisplayIdentity(user, profile);

  return {
    user,
    profile,
    identity,
  };
}

/**
 * The authenticated shell and its page content frequently need the same session
 * and profile. Memoize the composite lookup for the duration of the request so
 * the profile is loaded once without introducing cross-request caching.
 */
export const requireAuthenticatedUserWithProfile = cache(
  requireAuthenticatedUserWithProfileUncached,
);
