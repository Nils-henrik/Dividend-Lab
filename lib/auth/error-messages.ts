/** Map provider/auth errors to safe Swedish messages without revealing account existence. */

export function getSafeAuthErrorMessage(rawMessage?: string | null): string {
  const message = (rawMessage ?? "").toLowerCase();

  if (!message) {
    return "Kunde inte slutföra inloggningen. Kontrollera uppgifterna och försök igen.";
  }

  if (
    message.includes("invalid login") ||
    message.includes("invalid credentials") ||
    message.includes("invalid email or password") ||
    message.includes("email not confirmed")
  ) {
    return "E-post eller lösenord stämmer inte, eller så behöver kontot bekräftas via e-post.";
  }

  if (message.includes("too many") || message.includes("rate")) {
    return "För många försök. Vänta en stund och försök igen.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Nätverksfel. Kontrollera din anslutning och försök igen.";
  }

  return "Kunde inte slutföra inloggningen. Kontrollera uppgifterna och försök igen.";
}
