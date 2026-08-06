import { readFileSync } from "node:fs";

import { CURSOR_API_CREATE_AGENT_URL } from "./config";
import { sanitizeApiError } from "./sanitize-error";
import type { CursorAgentCreatePayload } from "./cursor-payload";
import type { CursorAgentCreateResponse } from "./types";

export type CursorApiResult =
  | { ok: true; data: CursorAgentCreateResponse; duplicate: boolean }
  | { ok: false; status: number; message: string };

export async function createCursorAgent(
  apiKey: string,
  payload: CursorAgentCreatePayload,
): Promise<CursorApiResult> {
  const response = await fetch(CURSOR_API_CREATE_AGENT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = rawText;
  }

  if (response.status === 409) {
    return {
      ok: true,
      data: (parsed as CursorAgentCreateResponse) ?? {
        agent: { id: payload.agentId },
      },
      duplicate: true,
    };
  }

  if (!response.ok) {
    const message = sanitizeApiError(parsed ?? rawText);
    return {
      ok: false,
      status: response.status,
      message: `Cursor API error (${response.status}): ${message}`,
    };
  }

  return {
    ok: true,
    data: parsed as CursorAgentCreateResponse,
    duplicate: false,
  };
}

export function requireApiKey(): string {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CURSOR_API_KEY is not configured.");
  }
  return apiKey;
}

export function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
