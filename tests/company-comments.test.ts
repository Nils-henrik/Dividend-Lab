import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { COMPANY_COMMENT_MAX_LENGTH, validateCompanyCommentBody } from "../lib/companies/comments";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260924203000_create_company_comments.sql",
    import.meta.url,
  ),
  "utf8",
);

const actions = readFileSync(new URL("../app/bolag/actions.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/bolag/[slug]/page.tsx", import.meta.url), "utf8");
const comments = readFileSync(
  new URL("../components/companies/CompanyComments.tsx", import.meta.url),
  "utf8",
);
const deleteButton = readFileSync(
  new URL("../components/companies/DeleteCompanyCommentButton.tsx", import.meta.url),
  "utf8",
);
const query = readFileSync(
  new URL("../lib/companies/comments.server.ts", import.meta.url),
  "utf8",
);
const reporting = readFileSync(
  new URL("../lib/moderation/reporting.server.ts", import.meta.url),
  "utf8",
);
const direct = readFileSync(
  new URL("../lib/moderation/direct.server.ts", import.meta.url),
  "utf8",
);
const types = readFileSync(new URL("../lib/moderation/types.ts", import.meta.url), "utf8");
const config = readFileSync(new URL("../lib/moderation/config.ts", import.meta.url), "utf8");

test("kommentarsvalidering trimmar, kräver text och stoppar för lång text", () => {
  assert.equal(validateCompanyCommentBody("   ").error, "Skriv en kommentar innan du publicerar.");
  assert.equal(validateCompanyCommentBody("  Hej  ").body, "Hej");
  assert.equal(validateCompanyCommentBody("a".repeat(COMPANY_COMMENT_MAX_LENGTH)).error, null);
  assert.match(
    validateCompanyCommentBody("a".repeat(COMPANY_COMMENT_MAX_LENGTH + 1)).error ?? "",
    /högst 2000/,
  );
});

test("company_comments har RLS, synlig läsning och inget användar-update", () => {
  assert.match(migration, /create table public\.company_comments/);
  assert.match(migration, /company_id uuid not null references public\.companies\(id\) on delete cascade/);
  assert.match(migration, /user_id uuid not null references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /moderation_status in \('visible', 'hidden', 'removed'\)/);
  assert.match(migration, /char_length\(btrim\(body\)\) between 1 and 2000/);
  assert.match(
    migration,
    /create index company_comments_company_created_idx[\s\S]*company_id, created_at desc[\s\S]*where moderation_status = 'visible'/,
  );
  assert.match(migration, /create index company_comments_user_idx/);
  assert.match(migration, /alter table public\.company_comments enable row level security/);
  assert.match(migration, /create policy company_comments_visible_read/);
  assert.match(migration, /using \(moderation_status = 'visible'\)/);
  assert.match(migration, /create policy company_comments_own_insert/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /create policy company_comments_own_delete/);
  assert.doesNotMatch(migration, /create policy company_comments_own_update/);
  assert.doesNotMatch(migration, /grant update \(/);
  assert.match(migration, /grant select on table public\.company_comments to anon, authenticated/);
  assert.match(
    migration,
    /grant insert \(company_id, user_id, body\) on table public\.company_comments to authenticated/,
  );
  assert.match(migration, /grant delete on table public\.company_comments to authenticated/);
  assert.doesNotMatch(migration, /grant update on table public\.company_comments to anon, authenticated/);
  assert.doesNotMatch(migration, /security definer[\s\S]*company_comments_own/);
});

test("moderering kan dölja och ta bort bolagskommentarer utan att tappa tidigare mål", () => {
  assert.match(migration, /'company_comment'/);
  assert.match(
    migration,
    /report_row\.target_type in \('forum_thread', 'forum_reply', 'learning_comment', 'company_comment'\)/,
  );
  assert.match(migration, /update public\.company_comments/);
  assert.match(migration, /update public\.forum_threads/);
  assert.match(migration, /update public\.forum_replies/);
  assert.match(migration, /update public\.learning_article_comments/);
  assert.match(migration, /is_hidden = true/);
  assert.match(migration, /security definer/);
  assert.match(migration, /grant execute on function public\.apply_moderation_decision/);
  assert.match(types, /"company_comment"/);
  assert.match(config, /"company_comment"/);
  assert.match(reporting, /targetType === "company_comment"/);
  assert.match(reporting, /#comment-\$\{data\.id\}/);
  assert.match(reporting, /targetOwnerUserId: data\.user_id/);
  assert.match(direct, /targetType === "company_comment"/);
  assert.match(direct, /Kommentar om \$\{company\.name\}/);
});

test("bolagssidan visar kommentarer sist och mutationer är bundna", () => {
  assert.match(page, /<CompanyComments/);
  assert.match(page, /companyName=\{company\.displayName\}/);
  assert.match(page, /alternates: \{ canonical: getCanonicalUrl\(path\) \}/);
  assert.match(comments, /Kommentarer om \{companyName\}/);
  assert.match(comments, /Logga in för att kommentera/);
  assert.match(comments, /login\?redirect=/);
  assert.match(comments, /id=\{`comment-\$\{comment\.id\}`\}/);
  assert.match(comments, /targetType=company_comment/);
  assert.match(comments, /Rapportera/);
  assert.match(comments, /DeleteCompanyCommentButton/);
  assert.match(deleteButton, /Ta bort/);
  assert.match(comments, /whitespace-pre-wrap/);
  assert.match(query, /\.eq\("moderation_status", "visible"\)/);
  assert.match(query, /\.limit\(COMPANY_COMMENT_PAGE_SIZE\)/);
  assert.match(query, /\.in\("id", userIds\)/);
  assert.match(actions, /user_id: user\.id/);
  assert.doesNotMatch(actions, /user_id: getFormString\(formData, "userId"\)/);
  assert.match(actions, /validateCompanyCommentBody/);
  assert.match(actions, /\.eq\("user_id", user\.id\)/);
  assert.match(actions, /revalidatePath\(company\.path\)/);
  assert.match(actions, /getCompanyProfile\(slug\)/);
});
