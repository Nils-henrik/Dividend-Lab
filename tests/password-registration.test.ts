import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPasswordRequirements,
  getPasswordUtf8ByteLength,
  validateRegistrationPassword,
} from "../lib/auth/password";

describe("registration password validation", () => {
  it("accepts mixed-case letters and numbers", () => {
    assert.deepEqual(validateRegistrationPassword("Henke920"), { ok: true });
  });

  it("accepts ordinary special characters without a whitelist", () => {
    const symbols = "!@#%^+&*=( )/<>_[]-'\":;,?.`~\\|{}$".replace(" ", "");
    assert.deepEqual(validateRegistrationPassword(`Aa1${symbols}`), {
      ok: true,
    });
  });

  it("accepts supported international and Unicode special characters", () => {
    const symbols = "€×÷£¥₩°•○●□■♤♡◇♧☆▪︎¤《》¡¿";
    const password = `Åa1${symbols}`;

    assert.ok(getPasswordUtf8ByteLength(password) <= 72);
    assert.deepEqual(validateRegistrationPassword(password), { ok: true });
  });

  it("reports each missing required character class in plain Swedish", () => {
    assert.deepEqual(validateRegistrationPassword("henke920"), {
      ok: false,
      error: "Lösenordet måste innehålla minst en stor bokstav.",
    });
    assert.deepEqual(validateRegistrationPassword("HENKE920"), {
      ok: false,
      error: "Lösenordet måste innehålla minst en liten bokstav.",
    });
    assert.deepEqual(validateRegistrationPassword("HenkeHenke"), {
      ok: false,
      error: "Lösenordet måste innehålla minst en siffra.",
    });
  });

  it("rejects passwords shorter than eight characters", () => {
    assert.deepEqual(validateRegistrationPassword("Aa1!abc"), {
      ok: false,
      error: "Lösenordet måste innehålla minst 8 tecken.",
    });
  });

  it("matches the Auth service maximum of 72 UTF-8 bytes", () => {
    assert.deepEqual(validateRegistrationPassword(`Aa1${"x".repeat(69)}`), {
      ok: true,
    });
    assert.deepEqual(validateRegistrationPassword(`Aa1${"x".repeat(70)}`), {
      ok: false,
      error: "Lösenordet är för långt. Det får vara högst 72 byte i UTF-8.",
    });

    const unicodePassword = `Aa1${"€".repeat(24)}`;
    assert.equal(getPasswordUtf8ByteLength(unicodePassword), 75);
    assert.equal(validateRegistrationPassword(unicodePassword).ok, false);
  });

  it("updates every live checklist condition from the current value", () => {
    const unmet = getPasswordRequirements("abc");
    assert.equal(
      unmet.every((requirement) => !requirement.met),
      false,
    );
    assert.equal(unmet.find(({ key }) => key === "lowercase")?.met, true);
    assert.equal(unmet.find(({ key }) => key === "maximum")?.met, true);

    assert.equal(
      getPasswordRequirements("Ångström9").every(
        (requirement) => requirement.met,
      ),
      true,
    );
  });
});
