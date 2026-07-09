"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createForumThreadSlug } from "@/lib/forum/format";
import {
  getForumThreadBySlugFromDatabase,
  isForumCategorySlug,
} from "@/lib/forum/queries";
import {
  isForumReactionTargetType,
  isForumReactionType,
} from "@/lib/forum/reactions";
import { isSelfForumReactionTarget } from "@/lib/forum/reactions.server";
import type { ForumActionState } from "@/lib/forum/types";
import {
  validateForumBody,
  validateForumTitle,
} from "@/lib/forum/validation";
import { createClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function createForumThreadAction(
  _state: ForumActionState,
  formData: FormData,
): Promise<ForumActionState> {
  const user = await requireAuthenticatedUser();
  const categorySlug = getFormString(formData, "categorySlug").trim();
  const titleValidation = validateForumTitle(getFormString(formData, "title"));
  const bodyValidation = validateForumBody(getFormString(formData, "body"));

  if (!isForumCategorySlug(categorySlug)) {
    return {
      status: "error",
      message: "Välj en giltig kategori.",
    };
  }

  if (titleValidation.error) {
    return {
      status: "error",
      message: titleValidation.error,
    };
  }

  if (bodyValidation.error) {
    return {
      status: "error",
      message: bodyValidation.error,
    };
  }

  const slug = createForumThreadSlug(titleValidation.title);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      slug,
      author_id: user.id,
      category_slug: categorySlug,
      title: titleValidation.title,
      body: bodyValidation.body,
    })
    .select("slug")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: "Diskussionen kunde inte skapas. Försök igen.",
    };
  }

  revalidatePath("/forum");
  revalidatePath(`/forum/${data.slug}`);
  redirect(`/forum/${data.slug}`);
}

export async function createForumReplyAction(
  _state: ForumActionState,
  formData: FormData,
): Promise<ForumActionState> {
  const user = await requireAuthenticatedUser();
  const threadSlug = getFormString(formData, "threadSlug").trim();
  const bodyValidation = validateForumBody(getFormString(formData, "body"));

  if (!threadSlug) {
    return {
      status: "error",
      message: "Diskussionen kunde inte hittas.",
    };
  }

  if (bodyValidation.error) {
    return {
      status: "error",
      message: bodyValidation.error,
    };
  }

  const thread = await getForumThreadBySlugFromDatabase(threadSlug);

  if (!thread) {
    return {
      status: "error",
      message: "Diskussionen kunde inte hittas.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("forum_replies").insert({
    thread_id: thread.id,
    author_id: user.id,
    body: bodyValidation.body,
  });

  if (error) {
    return {
      status: "error",
      message: "Ditt svar kunde inte publiceras. Försök igen.",
    };
  }

  revalidatePath("/forum");
  revalidatePath(`/forum/${threadSlug}`);
  redirect(`/forum/${threadSlug}#forum-replies`);
}

export async function toggleForumReactionAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const targetType = getFormString(formData, "targetType").trim();
  const targetId = getFormString(formData, "targetId").trim();
  const reactionType = getFormString(formData, "reactionType").trim();
  const threadSlug = getFormString(formData, "threadSlug").trim();

  if (
    !threadSlug ||
    !targetId ||
    !isForumReactionTargetType(targetType) ||
    !isForumReactionType(reactionType)
  ) {
    return;
  }

  const supabase = await createClient();

  let existingQuery = supabase
    .from("forum_reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("reaction_type", reactionType);

  existingQuery =
    targetType === "thread"
      ? existingQuery.eq("thread_id", targetId).eq("target_type", "thread")
      : existingQuery.eq("reply_id", targetId).eq("target_type", "reply");

  const { data: existingReaction, error: existingError } =
    await existingQuery.maybeSingle();

  if (existingError) {
    return;
  }

  if (existingReaction) {
    const { error: deleteError } = await supabase
      .from("forum_reactions")
      .delete()
      .eq("id", existingReaction.id)
      .eq("user_id", user.id);

    if (deleteError) {
      return;
    }
  } else {
    const isSelfReaction = await isSelfForumReactionTarget(
      user.id,
      targetType,
      targetId,
    );

    if (isSelfReaction) {
      return;
    }

    if (targetType === "thread") {
      const { error: insertError } = await supabase.from("forum_reactions").insert({
        user_id: user.id,
        target_type: "thread",
        thread_id: targetId,
        reaction_type: reactionType,
      });

      if (insertError) {
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("forum_reactions").insert({
        user_id: user.id,
        target_type: "reply",
        reply_id: targetId,
        reaction_type: reactionType,
      });

      if (insertError) {
        return;
      }
    }
  }

  revalidatePath(`/forum/${threadSlug}`);
}
