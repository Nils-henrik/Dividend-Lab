import {
  FORUM_BODY_MAX_LENGTH,
  FORUM_TITLE_MAX_LENGTH,
} from "@/lib/forum/types";

export function validateForumTitle(title: string) {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return {
      title: "",
      error: "Ange en rubrik för diskussionen.",
    };
  }

  if (normalizedTitle.length > FORUM_TITLE_MAX_LENGTH) {
    return {
      title: "",
      error: `Rubriken får vara högst ${FORUM_TITLE_MAX_LENGTH} tecken.`,
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
      error: "Skriv något innan du skickar.",
    };
  }

  if (normalizedBody.length > FORUM_BODY_MAX_LENGTH) {
    return {
      body: "",
      error: `Innehållet får vara högst ${FORUM_BODY_MAX_LENGTH} tecken.`,
    };
  }

  return {
    body: normalizedBody,
    error: null,
  };
}
