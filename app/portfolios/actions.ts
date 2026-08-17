"use server";

import { revalidatePath } from "next/cache";
import { sendModelPortfolioFollowConfirmation } from "@/lib/model-portfolios/follower-email";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function setModelPortfolioFollowAction(formData: FormData) {
  const portfolioId = String(formData.get("portfolioId") ?? "").trim();
  const follow = String(formData.get("follow") ?? "") === "true";

  if (!UUID_PATTERN.test(portfolioId)) {
    return;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user) {
    return;
  }

  if (follow) {
    const [{ data: existingFollow, error: existingError }, { data: portfolio }] = await Promise.all([
      supabase
        .from("model_portfolio_followers")
        .select("portfolio_id")
        .eq("portfolio_id", portfolioId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("model_portfolios")
        .select("name,slug")
        .eq("id", portfolioId)
        .maybeSingle(),
    ]);

    if (existingError) return;

    const { data: followedRow, error: followError } = await supabase
      .from("model_portfolio_followers")
      .upsert(
        {
          portfolio_id: portfolioId,
          user_id: user.id,
          email_enabled: true,
        },
        { onConflict: "portfolio_id,user_id" },
      )
      .select("created_at")
      .single();

    if (followError) return;

    if (
      !existingFollow &&
      user.email &&
      user.email_confirmed_at &&
      portfolio?.name &&
      portfolio?.slug &&
      followedRow?.created_at
    ) {
      const emailResult = await sendModelPortfolioFollowConfirmation({
        recipientEmail: user.email,
        userId: user.id,
        portfolioId,
        portfolioName: portfolio.name,
        portfolioSlug: portfolio.slug,
        followedAt: followedRow.created_at,
      });

      if (emailResult.status === "failed") {
        console.error("[model-portfolios] follow confirmation email failed", {
          portfolioId,
          reason: emailResult.reason,
        });
      }
    }
  } else {
    const { error: unfollowError } = await supabase
      .from("model_portfolio_followers")
      .delete()
      .eq("portfolio_id", portfolioId)
      .eq("user_id", user.id);
    if (unfollowError) return;
  }

  revalidatePath("/portfolios");
}
