export const PASSWORD_MIN_CHARACTERS = 8;
export const PASSWORD_MAX_UTF8_BYTES = 72;

export type PasswordRequirement = {
  key: "minimum" | "uppercase" | "lowercase" | "number" | "maximum";
  label: string;
  met: boolean;
};

export type PasswordValidationResult =
  | { ok: true }
  | { ok: false; error: string };

function getCharacterCount(password: string) {
  return Array.from(password).length;
}

export function getPasswordUtf8ByteLength(password: string) {
  return new TextEncoder().encode(password).length;
}

export function getPasswordRequirements(
  password: string,
): PasswordRequirement[] {
  return [
    {
      key: "minimum",
      label: `Minst ${PASSWORD_MIN_CHARACTERS} tecken`,
      met: getCharacterCount(password) >= PASSWORD_MIN_CHARACTERS,
    },
    {
      key: "uppercase",
      label: "Minst en stor bokstav",
      met: /\p{Lu}/u.test(password),
    },
    {
      key: "lowercase",
      label: "Minst en liten bokstav",
      met: /\p{Ll}/u.test(password),
    },
    {
      key: "number",
      label: "Minst en siffra",
      met: /[0-9]/.test(password),
    },
    {
      key: "maximum",
      label: `Högst ${PASSWORD_MAX_UTF8_BYTES} byte i UTF-8`,
      met: getPasswordUtf8ByteLength(password) <= PASSWORD_MAX_UTF8_BYTES,
    },
  ];
}

export function validateRegistrationPassword(
  password: string,
): PasswordValidationResult {
  if (getCharacterCount(password) < PASSWORD_MIN_CHARACTERS) {
    return {
      ok: false,
      error: `Lösenordet måste innehålla minst ${PASSWORD_MIN_CHARACTERS} tecken.`,
    };
  }

  if (getPasswordUtf8ByteLength(password) > PASSWORD_MAX_UTF8_BYTES) {
    return {
      ok: false,
      error: `Lösenordet är för långt. Det får vara högst ${PASSWORD_MAX_UTF8_BYTES} byte i UTF-8.`,
    };
  }

  if (!/\p{Lu}/u.test(password)) {
    return {
      ok: false,
      error: "Lösenordet måste innehålla minst en stor bokstav.",
    };
  }

  if (!/\p{Ll}/u.test(password)) {
    return {
      ok: false,
      error: "Lösenordet måste innehålla minst en liten bokstav.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      ok: false,
      error: "Lösenordet måste innehålla minst en siffra.",
    };
  }

  return { ok: true };
}
