import { NextResponse } from "next/server";
import { createDivBrainAlphaAccessModule } from "@/lib/divbrain/server/access";
import { createDivBrainServiceRoleAttachmentRepository } from "@/lib/divbrain/server/attachments";
import { isDivBrainUuid } from "@/lib/divbrain/server/repository/ids";

type RouteContext = {
  params: Promise<{ attachmentId: string }>;
};

/**
 * Authenticated private attachment download.
 * Issues a short-lived signed URL and redirects — never a permanent public URL.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { attachmentId } = await context.params;
    if (!isDivBrainUuid(attachmentId)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const access = createDivBrainAlphaAccessModule();
    const actor = await access.actorResolver.resolveActor();
    if (!actor.ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const gate = await access.accessGate.checkAccess(actor.data.actorId);
    if (!gate.ok) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const repositoryResult = createDivBrainServiceRoleAttachmentRepository();
    if (!repositoryResult.ok) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }

    const signed = await repositoryResult.data.createSignedDownloadUrl({
      actorId: actor.data.actorId,
      attachmentId,
      expiresInSeconds: 60,
    });

    if (!signed.ok) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.redirect(signed.data.signedUrl, 302);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
