import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("registration username wiring", () => {
  it("collects username in the register form and passes it to signup metadata", () => {
    const form = readFileSync(
      join(root, "components/auth/RegisterForm.tsx"),
      "utf8",
    );
    const action = readFileSync(join(root, "app/register/actions.ts"), "utf8");
    const migration = readFileSync(
      join(
        root,
        "supabase/migrations/20260807090000_require_unique_usernames.sql",
      ),
      "utf8",
    );

    assert.match(form, /Användarnamn/);
    assert.match(form, /username: normalizedUsername/);
    assert.match(action, /validateUsername/);
    assert.match(action, /username: usernameResult\.username/);
    assert.match(migration, /username_required/);
    assert.match(migration, /insert into public\.profiles \(id, username\)/);
    assert.match(migration, /alter column username set not null/);
    assert.doesNotMatch(migration, /coalesce\(actor_username, 'medlem'\)/);
  });

  it("keeps profile editing username required", () => {
    const form = readFileSync(
      join(root, "components/account/ProfileEditForm.tsx"),
      "utf8",
    );

    assert.match(form, /name="username"/);
    assert.match(form, /required/);
    assert.match(form, /Obligatoriskt/);
  });
});
