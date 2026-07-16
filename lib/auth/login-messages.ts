export const INVALID_LOGIN_CREDENTIALS_MESSAGE =
  "Fel e-postadress, användarnamn eller lösenord.";

export type SignInResult = { ok: true } | { ok: false; message: string };
