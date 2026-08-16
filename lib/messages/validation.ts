import {
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_SUBJECT_MAX_LENGTH,
} from "./types";

export function validateMessageBody(
  body: string,
  { required }: { required: boolean },
) {
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    if (!required) {
      return {
        body: "",
        error: null as string | null,
      };
    }

    return {
      body: "",
      error: "Skriv ett meddelande innan du skickar.",
    };
  }

  if (normalizedBody.length > MESSAGE_BODY_MAX_LENGTH) {
    return {
      body: "",
      error: `Meddelandet får vara högst ${MESSAGE_BODY_MAX_LENGTH} tecken.`,
    };
  }

  return {
    body: normalizedBody,
    error: null as string | null,
  };
}

export function validateConversationSubject(
  subject: string,
  { required }: { required: boolean },
) {
  const normalizedSubject = subject.trim();

  if (!normalizedSubject) {
    if (!required) {
      return {
        subject: "",
        error: null as string | null,
      };
    }

    return {
      subject: "",
      error: "Ange ett ämne för konversationen.",
    };
  }

  if (normalizedSubject.length > MESSAGE_SUBJECT_MAX_LENGTH) {
    return {
      subject: "",
      error: `Ämnet får vara högst ${MESSAGE_SUBJECT_MAX_LENGTH} tecken.`,
    };
  }

  return {
    subject: normalizedSubject,
    error: null as string | null,
  };
}