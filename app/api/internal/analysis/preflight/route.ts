import { NextResponse } from "next/server";
import { resolveNordicEquityAnalysisTarget } from "@/lib/analysis/instrument-search";
import { methodologyAvailabilityMessage } from "@/lib/analysis/methodology-availability";
import { fetchYahooCompanyProfilePreflight } from "@/lib/analysis/yahoo-company-profile";
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

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.trim().toUpperCase() ?? "";
  const exchange = url.searchParams.get("exchange")?.trim().toUpperCase() ?? "";
  if (!symbol || symbol.length > 32 || !exchange || exchange.length > 8) {
    return noStore(
      NextResponse.json(
        {
          status: "invalid_target",
          supported: false,
          message: "Välj en giltig nordisk aktie innan metodiken verifieras.",
        },
        { status: 400 },
      ),
    );
  }

  const resolved = await resolveNordicEquityAnalysisTarget({ symbol, exchange });
  if (!resolved) {
    return noStore(
      NextResponse.json(
        {
          status: "target_not_supported",
          supported: false,
          message:
            "Instrumentet kunde inte verifieras som en nordisk aktie med nuvarande bolagsmetodik.",
        },
        { status: 404 },
      ),
    );
  }

  const preflight = await fetchYahooCompanyProfilePreflight({
    yahooSymbol: resolved.yahooSymbol,
  });
  if (!preflight) {
    return noStore(
      NextResponse.json(
        {
          status: "methodology_verification_unavailable",
          supported: false,
          message:
            "DivLab kunde inte verifiera bolagstyp och fundamental metodik just nu. Ingen analys startas förrän verifieringen fungerar igen.",
        },
        { status: 503 },
      ),
    );
  }

  const supported = preflight.methodology.status === "supported";
  return noStore(
    NextResponse.json({
      status: "ok",
      supported,
      target: resolved,
      companyType: preflight.classification.type,
      methodologyStatus: preflight.methodology.status,
      message: methodologyAvailabilityMessage({
        status: preflight.methodology.status,
        companyType: preflight.classification.type,
      }),
    }),
  );
}
