import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

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
    assert.match(form, /validateUsername/);
    assert.match(form, /username: usernameResult\.username/);
    assert.match(action, /validateUsername/);
    assert.match(action, /username: usernameResult\.username/);
    assert.match(action, /Användarnamnet är redan upptaget/);
    assert.match(migration, /username_required/);
    assert.match(migration, /insert into public\.profiles \(id, username\)/);
    assert.match(migration, /alter column username set not null/);
    assert.match(migration, /create trigger enforce_profile_username_policy/);
    assert.match(migration, /Existing non-null usernames are preserved/);
    assert.doesNotMatch(migration, /coalesce\(actor_username, 'medlem'\)/);
  });

  it("keeps profile editing username required and temporary handles private-safe", () => {
    const form = readFileSync(
      join(root, "components/account/ProfileEditForm.tsx"),
      "utf8",
    );
    const profile = readFileSync(join(root, "lib/profiles/profile.ts"), "utf8");

    assert.match(form, /name="username"/);
    assert.match(form, /required/);
    assert.match(form, /Obligatoriskt/);
    assert.doesNotMatch(profile, /createTemporaryUsername\(userId\)/);
    assert.match(profile, /createTemporaryUsername\(\)/);
  });
});
