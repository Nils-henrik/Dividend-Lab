"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isFollowableCompanySlug } from "@/lib/companies/follow-policy";
import {
  validateCompanyCommentBody,
  type CompanyCommentActionState,
} from "@/lib/companies/comments";
import { ensureProfileForUser } from "@/lib/profiles/profile";
import { createClient } from "@/lib/supabase/server";

export async function setCompanyFollowAction(formData: FormData) {
  const slug = String(formData.get("companySlug") ?? "").trim();
  const follow = String(formData.get("follow") ?? "") === "true";

  if (!isFollowableCompanySlug(slug)) {
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

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function resolveActiveCompany(slug: string) {
  if (!isFollowableCompanySlug(slug)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { id: data.id as string, slug, path: `/bolag/${slug}` };
}

export async function publishCompanyCommentAction(
  _state: CompanyCommentActionState,
  formData: FormData,
): Promise<CompanyCommentActionState> {
  const slug = getFormString(formData, "companySlug").trim();
  const company = await resolveActiveCompany(slug);

  if (!company) {
    return {
      status: "error",
      message: "Bolaget kunde inte hittas.",
    };
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(company.path)}`);
  }

  const profile = await ensureProfileForUser(user.id);

  if (!profile.username?.trim()) {
    return {
      status: "error",
      message: "Välj ett @namn i din profil för att kunna kommentera.",
    };
  }

  const bodyValidation = validateCompanyCommentBody(getFormString(formData, "body"));

  if (bodyValidation.error) {
    return {
      status: "error",
      message: bodyValidation.error,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("company_comments").insert({
    company_id: company.id,
    user_id: user.id,
    body: bodyValidation.body,
  });

  if (error) {
    return {
      status: "error",
      message: "Kommentaren kunde inte sparas. Försök igen.",
    };
  }

  revalidatePath(company.path);

  return {
    status: "success",
    message: "",
  };
}

export async function deleteCompanyCommentAction(
  _state: CompanyCommentActionState,
  formData: FormData,
): Promise<CompanyCommentActionState> {
  const slug = getFormString(formData, "companySlug").trim();
  const commentId = getFormString(formData, "commentId").trim();
  const company = await resolveActiveCompany(slug);

  if (!company || !commentId) {
    return {
      status: "error",
      message: "Kommentaren kunde inte tas bort.",
    };
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(company.path)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select("id");

  if (error || !data?.length) {
    return {
      status: "error",
      message: "Kommentaren kunde inte tas bort.",
    };
  }

  revalidatePath(company.path);

  return {
    status: "success",
    message: "",
  };
}

