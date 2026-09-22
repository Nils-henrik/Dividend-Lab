"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompanyProfile } from "@/lib/companies/catalog";
import { createClient } from "@/lib/supabase/server";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function setCompanyFollowAction(formData: FormData) {
  const slug = String(formData.get("companySlug") ?? "").trim();
  const follow = String(formData.get("follow") ?? "") === "true";

  if (!SLUG_PATTERN.test(slug) || !getCompanyProfile(slug)) {
    return;
  }

  const companyPath = `/bolag/${slug}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(companyPath)}`);
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (companyError || !company) {
    return;
  }

  if (follow) {
    const { error } = await supabase.from("company_follows").insert({
      user_id: user.id,
      company_id: company.id,
    });

    if (error && error.code !== "23505") {
      return;
    }
  } else {
    const { error } = await supabase
      .from("company_follows")
      .delete()
      .eq("company_id", company.id)
      .eq("user_id", user.id);

    if (error) {
      return;
    }
  }

  revalidatePath(companyPath);
  revalidatePath("/watchlist");
}

