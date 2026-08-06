import { CURSOR_API } from "./config";
import { sanitizeErrorMessage } from "./sanitize";
import type { CursorCreateAgentRequest } from "./cursor-payload";

export interface CursorAgentResponse {
  agentId: string;
  agentUrl: string | null;
  runId: string | null;
  status: string | null;
}

export class CursorApiError extends Error {
  readonly status: number;
  readonly safeMessage: string;

  constructor(status: number, safeMessage: string) {
    super(safeMessage);
    this.name = "CursorApiError";
    this.status = status;
    this.safeMessage = safeMessage;
  }
}

/**
 * Create a Cursor Cloud Agent via the official v1 API.
 * Uses Bearer auth. Never logs the API key or Authorization header.
 */
export async function createCursorAgent(input: {
  apiKey: string;
  request: CursorCreateAgentRequest;
  fetchImpl?: typeof fetch;
}): Promise<CursorAgentResponse> {
  if (!input.apiKey || input.apiKey.trim().length === 0) {
    throw new CursorApiError(0, "CURSOR_API_KEY is missing");
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const url = `${CURSOR_API.baseUrl}${CURSOR_API.createAgentPath}`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input.request),
    });
  } catch (error) {
    throw new CursorApiError(
      0,
      `Cursor API network error: ${sanitizeErrorMessage(error)}`,
    );
  }

  const rawText = await response.text();
  let parsed: unknown = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const apiCode =
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      parsed.error &&
      typeof parsed.error === "object" &&
      "code" in parsed.error
        ? String((parsed.error as { code?: unknown }).code)
        : null;

    const apiMessage =
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      parsed.error &&
      typeof parsed.error === "object" &&
      "message" in parsed.error
        ? String((parsed.error as { message?: unknown }).message)
        : null;

    const safe = sanitizeErrorMessage(
      apiCode || apiMessage
        ? `Cursor API ${response.status}: ${apiCode ?? "error"} ${apiMessage ?? ""}`.trim()
        : `Cursor API request failed with status ${response.status}`,
    );

    throw new CursorApiError(response.status, safe);
  }

  return extractAgentResponse(parsed);
}

function extractAgentResponse(parsed: unknown): CursorAgentResponse {
  if (!parsed || typeof parsed !== "object") {
    throw new CursorApiError(0, "Cursor API returned an empty or non-JSON body");
  }

  const root = parsed as {
    agent?: {
      id?: string;
      url?: string;
      status?: string;
    };
    run?: { id?: string };
    // Defensive: some gateways may flatten fields
    id?: string;
    url?: string;
  };

  const agentId = root.agent?.id ?? root.id;
  if (!agentId || typeof agentId !== "string") {
    throw new CursorApiError(0, "Cursor API response missing agent.id");
  }

  return {
    agentId,
    agentUrl:
      typeof root.agent?.url === "string"
        ? root.agent.url
        : typeof root.url === "string"
          ? root.url
          : `https://cursor.com/agents/${agentId}`,
    runId: typeof root.run?.id === "string" ? root.run.id : null,
    status: typeof root.agent?.status === "string" ? root.agent.status : null,
  };
}
