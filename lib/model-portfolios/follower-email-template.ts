export type ModelPortfolioEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type FollowConfirmationTemplateInput = {
  portfolioName: string;
  portfolioSlug: string;
  siteUrl: string;
};

export type TradeTemplateInput = FollowConfirmationTemplateInput & {
  side: "buy" | "sell";
  symbol: string;
  exchange: string;
  quantity: number;
  executionPriceMinor: number;
  currency: string;
  rationale: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function portfolioUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/$/, "")}/portfolios/${encodeURIComponent(slug)}`;
}

function formatMoney(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: 8,
  }).format(quantity);
}

function renderShell(input: {
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  return `<!doctype html>
<html lang="sv">
  <body style="margin:0;background:#07111f;font-family:Inter,Arial,sans-serif;color:#eaf2ff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07111f;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#0b1728;border:1px solid #1b3352;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:26px 28px 18px;border-bottom:1px solid #172b45;">
            <div style="font-size:20px;font-weight:800;letter-spacing:-0.4px;color:#ffffff;">Div<span style="color:#0a84ff;">Lab</span></div>
          </td></tr>
          <tr><td style="padding:30px 28px 10px;">
            <div style="font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#64a9ff;">${escapeHtml(input.eyebrow)}</div>
            <h1 style="margin:10px 0 14px;font-size:28px;line-height:1.15;color:#ffffff;">${escapeHtml(input.title)}</h1>
            ${input.bodyHtml}
          </td></tr>
          <tr><td style="padding:12px 28px 32px;">
            <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:#0a84ff;color:#ffffff;text-decoration:none;font-weight:800;padding:13px 18px;border-radius:10px;">${escapeHtml(input.ctaLabel)}</a>
          </td></tr>
          <tr><td style="padding:20px 28px;background:#081322;border-top:1px solid #172b45;font-size:12px;line-height:1.6;color:#8ea4bf;">
            Du får det här mailet eftersom du följer en av DivLabs AI-portföljer. Du kan när som helst sluta följa portföljen på DivLab.<br />
            DivLabs modellportföljer är ett öppet experiment och inte personlig investeringsrådgivning.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function buildFollowConfirmationEmail(
  input: FollowConfirmationTemplateInput,
): ModelPortfolioEmailContent {
  const url = portfolioUrl(input.siteUrl, input.portfolioSlug);
  const subject = `Du följer nu ${input.portfolioName} på DivLab`;

  return {
    subject,
    html: renderShell({
      preheader: `Du får en notis när ${input.portfolioName} genomför en ny affär.`,
      eyebrow: "Portföljbevakning aktiverad",
      title: `Du följer nu ${input.portfolioName}`,
      bodyHtml: `<p style="margin:0;font-size:16px;line-height:1.7;color:#b9c8da;">När portföljen genomför ett nytt köp eller en försäljning skickar DivLab en tydlig notis till den e-postadress som hör till ditt konto.</p>`,
      ctaLabel: "Öppna portföljen",
      ctaUrl: url,
    }),
    text: `Du följer nu ${input.portfolioName} på DivLab. När portföljen genomför ett nytt köp eller en försäljning skickar DivLab en notis till din registrerade e-postadress. ${url}`,
  };
}

export function buildTradeEmail(input: TradeTemplateInput): ModelPortfolioEmailContent {
  const url = portfolioUrl(input.siteUrl, input.portfolioSlug);
  const action = input.side === "buy" ? "Nytt köp" : "Ny försäljning";
  const actionSentence = input.side === "buy" ? "har köpt" : "har sålt";
  const price = formatMoney(input.executionPriceMinor, input.currency);
  const quantity = formatQuantity(input.quantity);
  const rationale = input.rationale.trim().slice(0, 900);
  const subject = `${input.portfolioName}: ${action} – ${input.symbol}`;
  const symbol = `${input.symbol}.${input.exchange}`;

  return {
    subject,
    html: renderShell({
      preheader: `${input.portfolioName} ${actionSentence} ${symbol}.`,
      eyebrow: "AI-portföljen har agerat",
      title: `${action}: ${symbol}`,
      bodyHtml: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:#081322;border:1px solid #1b3352;border-radius:12px;">
          <tr><td style="padding:16px;color:#8ea4bf;font-size:12px;text-transform:uppercase;letter-spacing:.7px;">Portfölj</td><td style="padding:16px;text-align:right;font-weight:700;color:#ffffff;">${escapeHtml(input.portfolioName)}</td></tr>
          <tr><td style="padding:0 16px 16px;color:#8ea4bf;font-size:12px;text-transform:uppercase;letter-spacing:.7px;">Affär</td><td style="padding:0 16px 16px;text-align:right;font-weight:700;color:#ffffff;">${escapeHtml(action)}</td></tr>
          <tr><td style="padding:0 16px 16px;color:#8ea4bf;font-size:12px;text-transform:uppercase;letter-spacing:.7px;">Antal</td><td style="padding:0 16px 16px;text-align:right;font-weight:700;color:#ffffff;">${escapeHtml(quantity)}</td></tr>
          <tr><td style="padding:0 16px 16px;color:#8ea4bf;font-size:12px;text-transform:uppercase;letter-spacing:.7px;">Pris</td><td style="padding:0 16px 16px;text-align:right;font-weight:700;color:#ffffff;">${escapeHtml(price)}</td></tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#ffffff;">Varför gjorde AI:n affären?</p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#b9c8da;">${escapeHtml(rationale || "Se den senaste analysen och affärshistoriken på portföljsidan.")}</p>`,
      ctaLabel: "Se affären på DivLab",
      ctaUrl: url,
    }),
    text: `${input.portfolioName} ${actionSentence} ${symbol}. Antal: ${quantity}. Pris: ${price}. Motivering: ${rationale || "Se affärshistoriken på portföljsidan."} ${url}`,
  };
}
