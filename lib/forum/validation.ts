import {
  FORUM_BODY_MAX_LENGTH,
  FORUM_TITLE_MAX_LENGTH,
} from "@/lib/forum/types";

export function validateForumTitle(title: string) {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return {
      title: "",
      error: "Enter a discussion title.",
    };
  }

  if (normalizedTitle.length > FORUM_TITLE_MAX_LENGTH) {
    return {
      title: "",
      error: `The title can be at most ${FORUM_TITLE_MAX_LENGTH} characters.`,
    };
  }

  return {
    title: normalizedTitle,
    error: null,
  };
}

export function validateForumBody(body: string) {
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    return {
      body: "",
      error: "Write something before submitting.",
    };
  }

  if (normalizedBody.length > FORUM_BODY_MAX_LENGTH) {
    return {
      body: "",
      error: `The content can be at most ${FORUM_BODY_MAX_LENGTH} characters.`,
    };
  }

  return {
    body: normalizedBody,
    error: null,
  };
}
