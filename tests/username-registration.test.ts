import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getForumAuthorUsername } from "../lib/forum/format";
import { validateProfileValues } from "../lib/profiles/validation";
import {
  createTemporaryUsername,
  isReservedUsername,
  normalizeUsername,
  validateUsername,
} from "../lib/profiles/username";

const reservedUsernames = [
  "divlab",
  "divlab_mod",
  "dividendlab",
  "admin",
  "administrator",
  "admins",
  "moderator",
  "moderators",
  "mod",
  "support",
  "help",
  "system",
  "official",
  "team",
  "staff",
  "root",
  "api",
  "security",
  "medlem",
  "anvandare",
];

describe("username validation", () => {
  it("normalizes usernames to lowercase trimmed values", () => {
    assert.equal(normalizeUsername("  Alice_01 "), "alice_01");
    assert.equal(normalizeUsername("   "), null);
  });

  it("requires a valid non-reserved username", () => {
    assert.equal(validateUsername("").ok, false);
    assert.equal(validateUsername("ab").ok, false);
    assert.equal(validateUsername("Alice!").ok, false);
    assert.equal(validateUsername("alice-name").ok, false);
    assert.equal(validateUsername("åke").ok, false);
    assert.equal(validateUsername("admin").ok, false);
    assert.equal(validateUsername("medlem").ok, false);
    assert.equal(validateUsername("anvandare").ok, false);
    assert.equal(validateUsername("DivLab_Mod").ok, false);

    const valid = validateUsername("  Alice_01 ");
    assert.equal(valid.ok, true);
    if (valid.ok) {
      assert.equal(valid.username, "alice_01");
    }
  });

  it("blocks reserved system names", () => {
    for (const reserved of reservedUsernames) {
      assert.equal(isReservedUsername(reserved), true);
      assert.equal(validateUsername(reserved).ok, false);
    }
  });

  it("creates random temporary handles within format limits", () => {
    const first = createTemporaryUsername();
    const second = createTemporaryUsername();

    assert.match(first, /^u_[a-f0-9]{12}$/);
    assert.match(second, /^u_[a-f0-9]{12}$/);
    assert.notEqual(first, second);
    assert.equal(validateUsername(first).ok, true);
    assert.equal(validateUsername(second).ok, true);
  });
});

describe("profile username requirements", () => {
  it("requires username when editing a profile", () => {
    const result = validateProfileValues({
      username: "",
      displayName: "Henrik",
      bio: "",
      favoriteSector: "",
      investorGoal: "",
    });

    assert.equal(result.errors.length > 0, true);
    assert.match(result.errors[0] ?? "", /användarnamn/i);
  });

  it("rejects reserved usernames during profile validation", () => {
    const result = validateProfileValues({
      username: "support",
      displayName: "Support",
      bio: "",
      favoriteSector: "",
      investorGoal: "",
    });

    assert.equal(
      result.errors[0],
      "Det användarnamnet är reserverat. Välj ett annat.",
    );
  });

  it("accepts a normalized unique-format username", () => {
    const result = validateProfileValues({
      username: "Henrik_01",
      displayName: "Henrik",
      bio: "",
      favoriteSector: "",
      investorGoal: "",
    });

    assert.deepEqual(result.errors, []);
    assert.equal(result.values.username, "henrik_01");
  });
});

describe("forum author username routing", () => {
  it("does not invent medlem or display-name slug handles", () => {
    assert.equal(getForumAuthorUsername(null), "");
    assert.equal(getForumAuthorUsername(""), "");
    assert.equal(getForumAuthorUsername("alice_01"), "alice_01");
  });
});
