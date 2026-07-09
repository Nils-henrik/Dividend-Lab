import { LEARNING_COMMENT_MAX_LENGTH } from "./types";

export function validateLearningCommentBody(body: string) {
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    return {
      body: "",
      error: "Skriv en kommentar innan du skickar.",
    };
  }

  if (normalizedBody.length > LEARNING_COMMENT_MAX_LENGTH) {
    return {
      body: "",
      error: `Kommentaren får vara högst ${LEARNING_COMMENT_MAX_LENGTH} tecken.`,
    };
  }

  return {
    body: normalizedBody,
    error: null,
  };
}
