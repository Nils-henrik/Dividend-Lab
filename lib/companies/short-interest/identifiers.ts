const LEI_PATTERN = /^[0-9A-Z]{20}$/;
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function expandedDigits(value: string): string {
  let digits = "";
  for (const character of value) {
    digits += character >= "0" && character <= "9"
      ? character
      : String(character.charCodeAt(0) - 55);
  }
  return digits;
}

export function isLei(value: string): boolean {
  if (!LEI_PATTERN.test(value)) return false;
  let remainder = 0;
  for (const character of expandedDigits(value)) {
    remainder = (remainder * 10 + Number(character)) % 97;
  }
  return remainder === 1;
}

export function isIsin(value: string): boolean {
  if (!ISIN_PATTERN.test(value)) return false;
  const digits = expandedDigits(value);
  let total = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let current = Number(digits[index]);
    if (doubleDigit) {
      current *= 2;
      if (current > 9) current -= 9;
    }
    total += current;
    doubleDigit = !doubleDigit;
  }
  return total % 10 === 0;
}

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function normalizeIssuerName(value: string): string {
  return value.normalize("NFC").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().toLocaleLowerCase("sv-SE");
}

export function normalizeOrganizationNumber(value: string): string | null {
  const digits = value.replace(/[-\s]/g, "");
  if (!/^\d{10}$/.test(digits)) return null;
  let total = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let current = Number(digits[index]);
    if (index % 2 === 0) {
      current *= 2;
      if (current > 9) current -= 9;
    }
    total += current;
  }
  return total % 10 === 0 ? digits : null;
}
