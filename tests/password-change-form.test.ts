import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("authenticated password change", () => {
  it("requires current password in the settings form and server action", () => {
    const form = readFileSync(
      join(root, "components/settings/ChangePasswordForm.tsx"),
      "utf8",
    );
    const action = readFileSync(
      join(root, "app/settings/actions.ts"),
      "utf8",
    );
    const recovery = readFileSync(
      join(root, "app/reset-password/page.tsx"),
      "utf8",
    );

    assert.match(form, /Nuvarande lösenord/);
    assert.match(form, /name="currentPassword"/);
    assert.match(form, /Nytt lösenord/);
    assert.match(form, /Bekräfta nytt lösenord/);
    assert.match(action, /signInWithPassword/);
    assert.match(action, /Det nuvarande lösenordet stämmer inte\./);
    assert.match(action, /De nya lösenorden matchar inte\./);
    assert.match(action, /Ditt lösenord har uppdaterats\./);
    assert.doesNotMatch(recovery, /currentPassword/);
  });
});
