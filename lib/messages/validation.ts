import { isChatUuid } from "./attachments";
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

export function parseChatAttachmentIds(value: unknown): {
  ids: string[];
  error: string | null;
} {
  if (value == null || value === "") {
    return { ids: [], error: null };
  }

  let raw: unknown = value;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value);
    } catch {
      return { ids: [], error: "Bilagorna kunde inte tolkas." };
    }
  }

  if (!Array.isArray(raw)) {
    return { ids: [], error: "Bilagorna kunde inte tolkas." };
  }

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string" || !isChatUuid(item)) {
      return { ids: [], error: "Bilagorna kunde inte tolkas." };
    }
    const id = item.toLowerCase();
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }

  return { ids, error: null };
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