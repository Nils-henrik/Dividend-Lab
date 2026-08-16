# Chat attachments v1 (Issue #239)

Private 1:1 chat files for DivLab Messenger-style chat: JPEG, PNG, WebP, GIF, PDF, plain text and CSV.

This document is the technical/privacy design for release review. It is **not** formal legal advice. Production apply of the migration, Storage policies and frontend must be sequenced after human/ChatGPT security review.

## Purpose

Enable conversation participants to share a small image, animated GIF or ordinary small file inside an existing permitted conversation. This is Messenger-familiar sharing, not a general cloud drive.

## Data processed

| Item | Stored | Notes |
|------|--------|-------|
| File bytes | Private Supabase Storage bucket `chat-attachments` | No public bucket, no permanent public URL |
| Original filename | Metadata only, sanitized for display | Treated as untrusted text |
| MIME type, byte size, SHA-256 checksum | Metadata | Confirmed from actual bytes |
| Uploader id, conversation id, message id | Metadata | Referential integrity via FK |
| Status | `pending` / `uploaded` / `ready` / `failed` / `deleted` | Transcript shows only `ready` + linked |

## Access model

- Authenticated clients may **SELECT** only `ready` rows with `message_id IS NOT NULL` for conversations they participate in.
- INSERT/UPDATE/DELETE of metadata is service-role or security-definer RPC. Frontend visibility is never the only barrier.
- Uploads use short-lived signed upload URLs created after `can_send_private_message`.
- Downloads use `/messages/attachments/[id]` → short-lived signed URL after participant RLS.
- Service-role secrets never reach client bundles.

## Limits

| Limit | Value |
|-------|-------|
| Max files / message | 3 |
| Max bytes / file | 10 MiB |
| Max total / send | 20 MiB |
| Text body | 2,000 characters (unchanged) |
| Abandoned unlinked TTL | 24 hours |
| Max active unlinked / user | 10 |
| Unlinked cleanup scan | 20 rows |

Attachment-only messages are allowed: `messages.body` may be empty when the send RPC links at least one ready attachment. No fake placeholder body is persisted.

## Lifecycle / transaction boundary

1. **Prepare** — server checks `canSend`, opportunistic TTL cleanup + unlinked quota, inserts `pending` metadata, returns a signed upload URL. Not visible in the transcript.
2. **Direct private upload** — browser PUTs to Storage. Invalid/oversize/disallowed files never become messages.
3. **Confirm** — server checks object existence, declared size, MIME allowlist and magic bytes. Failures are best-effort discarded (Storage API remove, then metadata `deleted`).
4. **Send** — `send_private_message_with_attachments` runs in one Postgres transaction: `can_send_private_message`, lock/validate ready unlinked owned rows, insert message (`has_attachments`), link rows. If linking fails, the whole transaction rolls back so transcript metadata cannot point at an unconfirmed object.
5. **Realtime** — message INSERT includes `has_attachments`. The client hydrates linked metadata without duplicating the message id. Text-only sends still use `send_private_message`.

## Retention and deletion

- Linked attachments last as long as the message/conversation/account, matching current private-message retention. There is no self-service delete of sent files in v1.
- Conversation `ON DELETE CASCADE` removes attachment metadata. Physical objects must be removed via the Storage API (`cleanupConversationStorage`) before any future conversation-delete product flow. DivLab 1:1 chat has no user-facing conversation delete today.
- Account delete cascades the uploader’s metadata via `uploader_id`. Operational account-deletion must call `cleanupUploaderStorage` (Storage API) so objects are not left billable. Direct `DELETE FROM storage.objects` is forbidden.
- Unlinked abandoned uploads: opportunistic 24h TTL cleanup before prepare, plus a `BEFORE INSERT` cap of 10 active unlinked rows per uploader (`SQLSTATE CHQ20`).

## Privacy-by-design

- Data minimisation: only allowlisted types, conservative size caps, no AI analysis of chat files, no third-party GIF search.
- Storage limitation: unlinked quota + TTL; linked files follow conversation lifetime until a deletion product exists.
- Integrity/confidentiality: private bucket, participant RLS, signed URLs, magic-byte confirm, opaque `{uploader_id}/{attachment_id}` paths.
- Existing message-request rules are unchanged: attachment prepare/send cannot bypass `can_send`.

## Legal / policy impact

This feature **does** expand processing of user-uploaded personal data in private chat. Do not claim “no legal impact”.

Before production release:

1. Legal/privacy review of this design and of `/privacy` copy.
2. Decide whether `LEGAL_PUBLISHED_VERSIONS.privacy` and `legal_document_versions` must bump (re-acceptance). This PR updates page copy and “last updated” but **does not** activate a new published legal version.
3. Manual security review of migration, RLS and Storage policies.
4. Do **not** apply the migration from the agent. Do **not** merge automatically.

## Related code

- `supabase/migrations/20260816200000_create_chat_message_attachments.sql`
- `lib/messages/attachments.ts`
- `lib/messages/server/attachments/`
- `app/messages/attachments/[attachmentId]/route.ts`
- `components/messages/chat/ChatComposer.tsx`
- `components/messages/chat/ChatMessageAttachments.tsx`
