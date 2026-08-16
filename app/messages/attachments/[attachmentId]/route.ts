import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  CHAT_ATTACHMENT_BUCKET,
  isChatUuid,
} from "@/lib/messages/attachments";
import { createClient } from "@/lib/supabase/server";
import { createChatServiceRoleAttachmentRepository } from "@/lib/messages/server/attachments/wiring";

type RouteContext = {
  params: Promise<{ attachmentId: string }>;
};

type LinkedAttachmentRow = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  status: string;
  message_id: string | null;
};

/**
 * Authenticated private chat attachment download.
 * Issues a short-lived signed URL after participant RLS authorization.
 * Never a permanent public URL.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAuthenticatedUser();
    const { attachmentId } = await context.params;
    if (!isChatUuid(attachmentId)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("message_attachments")
      .select(
        "id, storage_bucket, storage_path, original_filename, mime_type, status, message_id",
      )
      .eq("id", attachmentId)
      .maybeSingle<LinkedAttachmentRow>();

    if (error || !data || data.status !== "ready" || !data.message_id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (data.storage_bucket !== CHAT_ATTACHMENT_BUCKET) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const pathParts = data.storage_path.split("/");
    if (pathParts.length !== 2 || !pathParts.every((part) => isChatUuid(part))) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const repository = createChatServiceRoleAttachmentRepository();
    if (!repository.ok) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }

    const signed = await repository.data.createSignedDownloadUrl({
      storageBucket: data.storage_bucket,
      storagePath: data.storage_path,
    });
    if (!signed.ok) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const response = NextResponse.redirect(signed.data.signedUrl, 302);
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
    return response;
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
