"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getLearningArticle } from "@/data/learning-articles";
import { ensureProfileForUser } from "@/lib/profiles/profile";
import { createClient } from "@/lib/supabase/server";
import type { LearningCommentActionState } from "@/lib/learning/types";
import { validateLearningCommentBody } from "@/lib/learning/validation";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createLearningCommentAction(
  _state: LearningCommentActionState,
  formData: FormData,
): Promise<LearningCommentActionState> {
  const user = await requireAuthenticatedUser();
  const articleSlug = getFormString(formData, "articleSlug").trim();
  const bodyValidation = validateLearningCommentBody(getFormString(formData, "body"));

  if (!articleSlug || !getLearningArticle(articleSlug)) {
    return {
      status: "error",
      message: "Artikeln kunde inte hittas.",
    };
  }

  const profile = await ensureProfileForUser(user.id);

  if (!profile.username?.trim()) {
    return {
      status: "error",
      message: "Välj ett @namn i din profil för att kunna kommentera.",
    };
  }

  if (bodyValidation.error) {
    return {
      status: "error",
      message: bodyValidation.error,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("learning_article_comments").insert({
    article_slug: articleSlug,
    user_id: user.id,
    body: bodyValidation.body,
  });

  if (error) {
    return {
      status: "error",
      message: "Kommentaren kunde inte sparas. Försök igen.",
    };
  }

  revalidatePath(`/learning/${articleSlug}`);

  return {
    status: "success",
    message: "",
  };
}
