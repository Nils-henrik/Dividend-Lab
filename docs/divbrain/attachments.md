# DivBrain attachments v1 (Issue #166 / hardened #172 / #176)

Private file attachments for `/brain` chat: PDF, images (JPEG/PNG/WebP), plain text and CSV.

## Product behavior

- Composer: compact **Bifoga fil** control, optional drag/drop, chips with upload/error/remove.
- Text-only messages unchanged.
- Attachment-only messages persist as `Bifogad fil: <filename>` (or multi-file Swedish label).
- Attachments remain visible on the originating user message after reload.
- Follow-up turns may reuse a **bounded** recent-attachment set (last 2 messages / max 4 files), not the full history, and only within the remaining combined byte budget.
- Removing a ready/error unlinked chip discards the private object via a server-owned discard action (not UI-only). The chip is removed only after `{ ok: true }`; failed discard keeps the chip and shows safe Swedish retry copy.

## Architecture

1. Authenticated server creates a pending `divbrain_attachments` row + short-lived signed upload URL (service-role), after opportunistic abandoned-upload cleanup + unlinked quota check.
2. Browser uploads directly to the **private** `divbrain-attachments` bucket.
3. Server confirms upload (object exists, size match, magic-byte/MIME sniff) → `ready`.
4. Message submit sends opaque `attachmentIds` only; server re-resolves ownership/conversation/status.
5. One Cost Guard–guarded provider generation receives PDF/image file parts and/or delimited untrusted text extracts. No second model call for parsing.

## Limits

| Limit | Value |
|-------|-------|
| Max files / message | 4 |
| Max bytes / file | 20 MiB |
| Max total / message (current turn) | 40 MiB |
| Combined current + recent provider budget | 40 MiB |
| Recent follow-up reuse | max 2 messages / 4 files, within remaining byte budget |
| Abandoned unlinked TTL | 24 hours |
| Max active unlinked attachments / user | 20 |
| Unlinked cleanup scan bound | 40 rows |

## Safety

- All document content is untrusted (`user_owned_context` / `user_provided` sources).
- Delimiters: `<<<UNTRUSTED_USER_DOCUMENT …>>>` … `<<<END_UNTRUSTED_USER_DOCUMENT>>>`.
- Instructions inside files cannot override DivBrain policy.
- No public bucket / permanent public URLs. Downloads use `/brain/attachments/[id]` → short-lived signed URL after auth + Alpha gate.
- Never log file contents, signed URLs, or raw provider payloads.

## Cleanup (Storage API is authoritative)

Physical private objects are removed **only** through the Supabase Storage API (`storage.removeObjects` / `client.storage.from(bucket).remove(...)`). Direct `DELETE FROM storage.objects` is forbidden.

### Permanent conversation deletion

1. Resolve trusted actor + Alpha access.
2. List that actor/conversation’s attachment storage paths.
3. Remove objects via Storage API.
4. If Storage API cleanup fails (or attachment repository wiring fails), **do not** delete the conversation/metadata — return a safe error (fail closed).
5. Only after successful object cleanup may conversation delete proceed; FK cascade then removes attachment metadata.

### Explicit unlinked discard

- Server-owned `discardUnlinkedAttachment` / `discardDivBrainUnlinkedAttachmentAction`.
- Only for `message_id IS NULL` rows; linked transcript attachments cannot be discarded this way.
- Missing / cross-user / linked ids share the same safe not-found surface.
- Storage API removal first; metadata marked `deleted` only after successful object removal.
- Composer keeps the server attachment id after prepare succeeds; remove is disabled while uploading/discarding; ready/error chips with an id call discard and disappear only on success; failed upload/confirm after an id exists performs best-effort discard.

### Abandoned uploads (opportunistic, not a cron)

Before prepare:

1. Bounded scan of the user’s unlinked non-deleted rows (oldest first, scan limit 40).
2. Stale rows older than the 24h TTL are removed via Storage API, then metadata retired.
3. If active unlinked count is still ≥ 20, prepare is rejected with safe Swedish quota copy.

Hard concurrency guarantee (in addition to the app pre-check): a `BEFORE INSERT` trigger serializes per-`user_id` with a transaction-scoped advisory lock and rejects inserts that would push active unlinked rows (`message_id IS NULL AND status <> 'deleted'`) past 20. Rejection uses the stable internal contract `SQLSTATE DVQ20` / message `divbrain_unlinked_quota_exceeded`, mapped by the persistence adapter to `quota_exceeded` and then to the existing Swedish `unlinked_quota` client error. Linking a ready row and retiring a row as `deleted` are UPDATEs and are not blocked by this guard.

If signed-upload URL creation fails after the pending metadata row was inserted (and before any signed URL reaches the client), the row is immediately retired as `deleted` so it does not consume unlinked quota until TTL. The `failed` status remains reserved for flows where an upload/object may already exist and later Storage-API discard is required.

## Migration

`supabase/migrations/20260811120000_create_divbrain_attachments.sql`

Creates `divbrain_attachments`, private bucket, RLS/grants, metadata FK cascade, and the atomic unlinked-quota insert trigger. It does **not** create a trigger that deletes `storage.objects` rows. Authenticated clients receive SELECT-only metadata access; INSERT/UPDATE/DELETE remain service-role / server-owned.

Manual-only / high security review required before production apply.
