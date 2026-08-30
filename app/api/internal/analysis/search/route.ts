import { NextResponse } from "next/server";
import { searchAnalysisInstruments } from "@/lib/analysis/instrument-search";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CREATOR_ROLES = new Set(["founder", "ceo_divlab", "admin"]);

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return noStore(NextResponse.json({ status: "founder_auth_required" }, { status: 401 }));
  }

  const roles = await getStaffRolesForUser(user.id);
  if (!roles.some((role) => CREATOR_ROLES.has(role))) {
    return noStore(NextResponse.json({ status: "founder_role_required" }, { status: 403 }));
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80) {
    return noStore(NextResponse.json({ status: "invalid_query", results: [] }, { status: 400 }));
  }

  const results = await searchAnalysisInstruments({ query, limit: 8 });
  return noStore(NextResponse.json({ status: "ok", results }));
}
