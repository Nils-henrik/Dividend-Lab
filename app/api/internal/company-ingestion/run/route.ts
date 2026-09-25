import { NextResponse } from "next/server";

import { isAuthorizedCompanyIngestionCron } from "@/lib/companies/ingestion/cron-auth";
import { runCompanyIngestionBatch } from "@/lib/companies/ingestion/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (
    !isAuthorizedCompanyIngestionCron(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return new NextResponse(null, { status: 401 });
  }

  const result = await runCompanyIngestionBatch();
  const status =
    result.status === "unavailable" ||
    result.status === "recovery_error" ||
    result.status === "enqueue_error" ||
    result.status === "claim_error"
      ? 503
      : 200;

  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
