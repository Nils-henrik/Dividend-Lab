import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildFollowConfirmationEmail,
  buildTradeEmail,
  type ModelPortfolioEmailContent,
} from "./follower-email-template";

type EmailResult =
  | { status: "sent"; providerMessageId: string | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

type DispatchResult =
  | { status: "sent"; sent: number; skipped: number; failed: number }
  | { status: "skipped"; reason: string; sent: 0; skipped: number; failed: 0 }
  | { status: "failed"; reason: string; sent: number; skipped: number; failed: number };

type TradeTransactionRow = {
  id: string;
  portfolio_id: string;
  transaction_type: "buy" | "sell" | "dividend" | "fee";
  instrument_symbol: string;
  exchange: string;
  quantity: number | string;
  price_minor: number | null;
  gross_amount_minor: number;
  currency: string;
  rationale: string;
};

type DeliveryRow = {
  status: "pending" | "sent" | "failed";
  attempts: number;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://divlab.se").replace(/\/$/, "");
const SEND_CONCURRENCY = 8;

function emailConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.DIVLAB_EMAIL_FROM?.trim();
  return apiKey && from ? { apiKey, from } : null;
}

async function sendResendEmail(input: {
  to: string;
  content: ModelPortfolioEmailContent;
  idempotencyKey: string;
}): Promise<EmailResult> {
  const config = emailConfig();
  if (!config) return { status: "skipped", reason: "email_provider_unconfigured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: input.content.subject,
        html: input.content.html,
        text: input.content.text,
        tags: [{ name: "category", value: "model_portfolio" }],
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      return {
        status: "failed",
        reason: `resend_${response.status}:${String(payload.name ?? payload.message ?? "unknown").slice(0, 160)}`,
      };
    }

    return { status: "sent", providerMessageId: payload.id ?? null };
  } catch (error) {
    return {
      status: "failed",
      reason: `resend_network:${error instanceof Error ? error.message.slice(0, 160) : "unknown"}`,
    };
  }
}

export async function sendModelPortfolioFollowConfirmation(input: {
  recipientEmail: string;
  userId: string;
  portfolioId: string;
  portfolioName: string;
  portfolioSlug: string;
  followedAt: string;
}): Promise<EmailResult> {
  const content = buildFollowConfirmationEmail({
    portfolioName: input.portfolioName,
    portfolioSlug: input.portfolioSlug,
    siteUrl: SITE_URL,
  });

  return sendResendEmail({
    to: input.recipientEmail,
    content,
    idempotencyKey: `model-portfolio-follow/${input.portfolioId}/${input.userId}/${input.followedAt}`,
  });
}

async function markDelivery(input: {
  supabase: SupabaseClient;
  transactionId: string;
  userId: string;
  status: "sent" | "failed";
  attempts: number;
  providerMessageId?: string | null;
  error?: string | null;
}): Promise<void> {
  const { error } = await input.supabase
    .from("model_portfolio_email_deliveries")
    .update({
      status: input.status,
      attempts: input.attempts,
      provider_message_id: input.providerMessageId ?? null,
      last_error: input.error?.slice(0, 500) ?? null,
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("transaction_id", input.transactionId)
    .eq("user_id", input.userId);

  if (error) {
    console.error("[model-portfolios] failed to update email delivery ledger", {
      transactionId: input.transactionId,
      userId: input.userId,
      code: error.code,
    });
  }
}

async function deliverTradeToFollower(input: {
  supabase: SupabaseClient;
  userId: string;
  portfolioName: string;
  portfolioSlug: string;
  transaction: TradeTransactionRow;
}): Promise<"sent" | "skipped" | "failed"> {
  const { error: claimError } = await input.supabase
    .from("model_portfolio_email_deliveries")
    .upsert(
      {
        transaction_id: input.transaction.id,
        user_id: input.userId,
        status: "pending",
      },
      {
        onConflict: "transaction_id,user_id",
        ignoreDuplicates: true,
      },
    );
  if (claimError) return "failed";

  const { data: delivery, error: deliveryError } = await input.supabase
    .from("model_portfolio_email_deliveries")
    .select("status,attempts")
    .eq("transaction_id", input.transaction.id)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (deliveryError || !delivery) return "failed";

  const deliveryRow = delivery as DeliveryRow;
  if (deliveryRow.status === "sent") return "skipped";

  const { data: authData, error: authError } = await input.supabase.auth.admin.getUserById(input.userId);
  const recipientEmail = authData.user?.email?.trim();
  if (authError || !recipientEmail || !authData.user?.email_confirmed_at) {
    await markDelivery({
      supabase: input.supabase,
      transactionId: input.transaction.id,
      userId: input.userId,
      status: "failed",
      attempts: Number(deliveryRow.attempts ?? 0) + 1,
      error: "missing_confirmed_auth_email",
    });
    return "failed";
  }

  const quantity = Number(input.transaction.quantity);
  const grossAmountMinor = Number(input.transaction.gross_amount_minor);
  const storedPriceMinor = Number(input.transaction.price_minor ?? 0);
  const executionPriceMinor =
    storedPriceMinor > 0
      ? storedPriceMinor
      : quantity > 0 && grossAmountMinor > 0
        ? Math.round(grossAmountMinor / quantity)
        : 0;

  if (!Number.isFinite(quantity) || quantity <= 0 || executionPriceMinor <= 0) {
    await markDelivery({
      supabase: input.supabase,
      transactionId: input.transaction.id,
      userId: input.userId,
      status: "failed",
      attempts: Number(deliveryRow.attempts ?? 0) + 1,
      error: "invalid_transaction_email_payload",
    });
    return "failed";
  }

  const content = buildTradeEmail({
    portfolioName: input.portfolioName,
    portfolioSlug: input.portfolioSlug,
    siteUrl: SITE_URL,
    side: input.transaction.transaction_type as "buy" | "sell",
    symbol: input.transaction.instrument_symbol,
    exchange: input.transaction.exchange,
    quantity,
    executionPriceMinor,
    currency: input.transaction.currency,
    rationale: input.transaction.rationale,
  });

  const result = await sendResendEmail({
    to: recipientEmail,
    content,
    idempotencyKey: `model-portfolio-trade/${input.transaction.id}/${input.userId}`,
  });

  if (result.status === "sent") {
    await markDelivery({
      supabase: input.supabase,
      transactionId: input.transaction.id,
      userId: input.userId,
      status: "sent",
      attempts: Number(deliveryRow.attempts ?? 0) + 1,
      providerMessageId: result.providerMessageId,
    });
    return "sent";
  }

  if (result.status === "skipped") return "skipped";

  await markDelivery({
    supabase: input.supabase,
    transactionId: input.transaction.id,
    userId: input.userId,
    status: "failed",
    attempts: Number(deliveryRow.attempts ?? 0) + 1,
    error: result.reason,
  });
  return "failed";
}

export async function notifyModelPortfolioFollowersOfTransaction(input: {
  supabase: SupabaseClient;
  transactionId: string;
}): Promise<DispatchResult> {
  if (!emailConfig()) {
    return {
      status: "skipped",
      reason: "email_provider_unconfigured",
      sent: 0,
      skipped: 0,
      failed: 0,
    };
  }

  const { data: transaction, error: transactionError } = await input.supabase
    .from("model_portfolio_transactions")
    .select(
      "id,portfolio_id,transaction_type,instrument_symbol,exchange,quantity,price_minor,gross_amount_minor,currency,rationale",
    )
    .eq("id", input.transactionId)
    .maybeSingle();
  if (transactionError || !transaction) {
    return {
      status: "failed",
      reason: "transaction_unavailable",
      sent: 0,
      skipped: 0,
      failed: 1,
    };
  }

  const transactionRow = transaction as TradeTransactionRow;
  if (transactionRow.transaction_type !== "buy" && transactionRow.transaction_type !== "sell") {
    return {
      status: "skipped",
      reason: "non_trade_transaction",
      sent: 0,
      skipped: 0,
      failed: 0,
    };
  }

  const [{ data: portfolio, error: portfolioError }, { data: followers, error: followersError }] =
    await Promise.all([
      input.supabase
        .from("model_portfolios")
        .select("name,slug")
        .eq("id", transactionRow.portfolio_id)
        .maybeSingle(),
      input.supabase
        .from("model_portfolio_followers")
        .select("user_id")
        .eq("portfolio_id", transactionRow.portfolio_id)
        .eq("email_enabled", true),
    ]);

  if (portfolioError || !portfolio) {
    return {
      status: "failed",
      reason: "portfolio_unavailable",
      sent: 0,
      skipped: 0,
      failed: 1,
    };
  }
  if (followersError) {
    return {
      status: "failed",
      reason: "followers_unavailable",
      sent: 0,
      skipped: 0,
      failed: 1,
    };
  }

  const followerRows = (followers ?? []) as Array<{ user_id: string }>;
  if (!followerRows.length) {
    return { status: "sent", sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (let offset = 0; offset < followerRows.length; offset += SEND_CONCURRENCY) {
    const batch = followerRows.slice(offset, offset + SEND_CONCURRENCY);
    const results = await Promise.all(
      batch.map((follower) =>
        deliverTradeToFollower({
          supabase: input.supabase,
          userId: follower.user_id,
          portfolioName: String(portfolio.name),
          portfolioSlug: String(portfolio.slug),
          transaction: transactionRow,
        }),
      ),
    );

    for (const result of results) {
      if (result === "sent") sent += 1;
      else if (result === "skipped") skipped += 1;
      else failed += 1;
    }
  }

  return failed > 0
    ? {
        status: "failed",
        reason: "one_or_more_deliveries_failed",
        sent,
        skipped,
        failed,
      }
    : { status: "sent", sent, skipped, failed };
}
