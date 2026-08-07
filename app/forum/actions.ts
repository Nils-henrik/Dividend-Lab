"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createForumThreadSlug } from "@/lib/forum/format";
import {
  getForumReplyRevisionHistory,
  getForumThreadBySlugFromDatabase,
  getForumThreadRevisionHistory,
  isForumCategorySlug,
} from "@/lib/forum/queries";
import {
  isForumReactionTargetType,
  isForumReactionType,
} from "@/lib/forum/reactions";
import { isSelfForumReactionTarget } from "@/lib/forum/reactions.server";
import type { ForumActionState, ForumReactionActionResult } from "@/lib/forum/types";
import {
  validateForumBody,
  validateForumTitle,
} from "@/lib/forum/validation";
import { createClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function revalidateForumThreadPaths(threadSlug: string) {
  revalidatePath("/forum");
  revalidatePath("/dashboard");
  revalidatePath(`/forum/${threadSlug}`);
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
  revalidatePath("/dashboard");
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
  const { data: reply, error } = await supabase
    .from("forum_replies")
    .insert({
      thread_id: thread.id,
      author_id: user.id,
      body: bodyValidation.body,
    })
    .select("id")
    .single();

  if (error || !reply) {
    return {
      status: "error",
      message: "Ditt svar kunde inte publiceras. Försök igen.",
    };
  }

  revalidateForumThreadPaths(threadSlug);
  redirect(`/forum/${threadSlug}#reply-${reply.id}`);
}

export async function updateForumThreadAction(
  _state: ForumActionState,
  formData: FormData,
): Promise<ForumActionState> {
  const user = await requireAuthenticatedUser();
  const threadId = getFormString(formData, "threadId").trim();
  const threadSlug = getFormString(formData, "threadSlug").trim();
  const titleValidation = validateForumTitle(getFormString(formData, "title"));
  const bodyValidation = validateForumBody(getFormString(formData, "body"));

  if (!threadId || !threadSlug) {
    return {
      status: "error",
      message: "Diskussionen kunde inte hittas.",
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

  const thread = await getForumThreadBySlugFromDatabase(threadSlug);

  if (!thread || thread.id !== threadId) {
    return {
      status: "error",
      message: "Diskussionen kunde inte hittas.",
    };
  }

  if (thread.authorId !== user.id) {
    return {
      status: "error",
      message: "Du kan bara redigera dina egna inlägg.",
    };
  }

  if (
    thread.title === titleValidation.title &&
    thread.body === bodyValidation.body
  ) {
    return {
      status: "success",
      message: "",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_threads")
    .update({
      title: titleValidation.title,
      body: bodyValidation.body,
    })
    .eq("id", thread.id)
    .eq("author_id", user.id);

  if (error) {
    return {
      status: "error",
      message: "Inlägget kunde inte sparas. Försök igen.",
    };
  }

  revalidateForumThreadPaths(thread.slug);
  return {
    status: "success",
    message: "",
  };
}

export async function updateForumReplyAction(
  _state: ForumActionState,
  formData: FormData,
): Promise<ForumActionState> {
  const user = await requireAuthenticatedUser();
  const replyId = getFormString(formData, "replyId").trim();
  const threadSlug = getFormString(formData, "threadSlug").trim();
  const bodyValidation = validateForumBody(getFormString(formData, "body"));

  if (!replyId || !threadSlug) {
    return {
      status: "error",
      message: "Svaret kunde inte hittas.",
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
  const { data: reply, error: replyError } = await supabase
    .from("forum_replies")
    .select("id, thread_id, author_id, body")
    .eq("id", replyId)
    .maybeSingle();

  if (replyError || !reply || reply.thread_id !== thread.id) {
    return {
      status: "error",
      message: "Svaret kunde inte hittas.",
    };
  }

  if (reply.author_id !== user.id) {
    return {
      status: "error",
      message: "Du kan bara redigera dina egna inlägg.",
    };
  }

  if (reply.body === bodyValidation.body) {
    return {
      status: "success",
      message: "",
    };
  }

  const { error } = await supabase
    .from("forum_replies")
    .update({
      body: bodyValidation.body,
    })
    .eq("id", reply.id)
    .eq("author_id", user.id);

  if (error) {
    return {
      status: "error",
      message: "Svaret kunde inte sparas. Försök igen.",
    };
  }

  revalidateForumThreadPaths(threadSlug);
  return {
    status: "success",
    message: "",
  };
}

export async function fetchForumThreadRevisionHistoryAction(threadId: string) {
  const normalizedId = threadId.trim();

  if (!normalizedId) {
    return [];
  }

  return getForumThreadRevisionHistory(normalizedId);
}

export async function fetchForumReplyRevisionHistoryAction(replyId: string) {
  const normalizedId = replyId.trim();

  if (!normalizedId) {
    return [];
  }

  return getForumReplyRevisionHistory(normalizedId);
}

export async function toggleForumReactionAction(
  formData: FormData,
): Promise<void> {
  const result = await applyForumReactionToggle(formData);

  if (!result.ok) {
    console.error("[forum] reaction action failed:", result.message);
  }
}

async function applyForumReactionToggle(
  formData: FormData,
): Promise<ForumReactionActionResult> {
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
    return {
      ok: false,
      message: "Reaktionen kunde inte sparas.",
    };
  }

  const supabase = await createClient();

  const { data: existingReaction, error: existingError } = await supabase
    .from("forum_reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq(targetType === "thread" ? "thread_id" : "reply_id", targetId)
    .maybeSingle();

  if (existingError) {
    console.error("[forum] reaction lookup failed", existingError);
    return {
      ok: false,
      message: "Reaktionen kunde inte sparas. Försök igen.",
    };
  }

  if (!existingReaction) {
    const isSelfReaction = await isSelfForumReactionTarget(
      user.id,
      targetType,
      targetId,
    );

    if (isSelfReaction) {
      return {
        ok: false,
        message: "Du kan inte reagera på ditt eget inlägg.",
      };
    }
  }

  const { error } = await supabase.rpc("toggle_forum_reaction", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reaction_type: reactionType,
  });

  if (error) {
    console.error("[forum] toggle reaction failed", error);

    if (error.message.includes("SELF_REACTION_NOT_ALLOWED")) {
      return {
        ok: false,
        message: "Du kan inte reagera på ditt eget inlägg.",
      };
    }

    return {
      ok: false,
      message: "Reaktionen kunde inte sparas. Försök igen.",
    };
  }

  revalidatePath(`/forum/${threadSlug}`);
  return { ok: true };
}
