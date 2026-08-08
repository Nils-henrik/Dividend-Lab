"use server";

import { revalidatePath } from "next/cache";
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
    await supabase.from("model_portfolio_followers").upsert(
      {
        portfolio_id: portfolioId,
        user_id: user.id,
        email_enabled: true,
      },
      { onConflict: "portfolio_id,user_id" },
    );
  } else {
    await supabase
      .from("model_portfolio_followers")
      .delete()
      .eq("portfolio_id", portfolioId)
      .eq("user_id", user.id);
  }

  revalidatePath("/portfolios");
}
