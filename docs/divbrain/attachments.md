# DivBrain attachments v1 (Issue #166)

Private file attachments for `/brain` chat: PDF, images (JPEG/PNG/WebP), plain text and CSV.

## Product behavior

- Composer: compact **Bifoga fil** control, optional drag/drop, chips with upload/error/remove.
- Text-only messages unchanged.
- Attachment-only messages persist as `Bifogad fil: <filename>` (or multi-file Swedish label).
- Attachments remain visible on the originating user message after reload.
- Follow-up turns may reuse a **bounded** recent-attachment set (last 2 messages / max 4 files), not the full history.

## Architecture

1. Authenticated server creates a pending `divbrain_attachments` row + short-lived signed upload URL (service-role).
2. Browser uploads directly to the **private** `divbrain-attachments` bucket.
3. Server confirms upload (object exists, size match, magic-byte/MIME sniff) → `ready`.
4. Message submit sends opaque `attachmentIds` only; server re-resolves ownership/conversation/status.
5. One Cost Guard–guarded provider generation receives PDF/image file parts and/or delimited untrusted text extracts. No second model call for parsing.

## Limits

| Limit | Value |
|-------|-------|
| Max files / message | 4 |
| Max bytes / file | 20 MiB |
| Max total / message | 40 MiB |
| Allowed MIME | `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `text/plain`, `text/csv` |

## Safety

- All document content is untrusted (`user_owned_context` / `user_provided` sources).
- Delimiters: `<<<UNTRUSTED_USER_DOCUMENT …>>>` … `<<<END_UNTRUSTED_USER_DOCUMENT>>>`.
- Instructions inside files cannot override DivBrain policy.
- No public bucket / permanent public URLs. Downloads use `/brain/attachments/[id]` → short-lived signed URL after auth + Alpha gate.
- Never log file contents, signed URLs, or raw provider payloads.

## Cleanup

- `ON DELETE CASCADE` from conversations removes attachment metadata.
- `BEFORE DELETE` trigger best-effort removes private storage objects.
- App delete path also attempts storage cleanup before conversation delete.

## Migration

`supabase/migrations/20260811120000_create_divbrain_attachments.sql`

Manual-only / high security review required before production apply.
