export const ERICSSON_ORIGIN = "https://www.ericsson.com";
export const ERICSSON_PUBLISHER = "Ericsson";
export const ERICSSON_PRESS_RELEASE_SOURCE_URL =
  `${ERICSSON_ORIGIN}/en/newsroom/latest-news?locs=68304&typeFilters=3`;
export const ERICSSON_REPORTS_SOURCE_URL =
  `${ERICSSON_ORIGIN}/en/investors/financial-reports-and-presentations`;
export const ERICSSON_CALENDAR_SOURCE_URL =
  `${ERICSSON_ORIGIN}/en/investors/financial-calendar`;

export function isEricssonDocumentUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.origin === ERICSSON_ORIGIN &&
      url.username === "" &&
      url.password === "" &&
      url.port === "" &&
      url.hash === "" &&
      url.pathname.startsWith("/en/")
    );
  } catch {
    return false;
  }
}

export function isEricssonBotChallenge(html: string): boolean {
  return /just a moment|performing security verification|cf-chl|cdn-cgi\/challenge/i.test(
    html,
  );
}

export function parseEricssonOfficialHtml(html: string): {
  status: "error";
  reason: "bot_challenge" | "source_structure_unverified";
} {
  if (isEricssonBotChallenge(html)) {
    return { status: "error", reason: "bot_challenge" };
  }

  return { status: "error", reason: "source_structure_unverified" };
}
