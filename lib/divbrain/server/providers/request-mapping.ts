/**
 * Map DivBrain provider requests to AI SDK prompt shapes.
 *
 * Context blocks stay server-side system instructions. They must never be
 * echoed back to the browser or written into benchmark artifacts.
 *
 * Finance Intelligence v4 adds one deterministic, query-specific specialist
 * playbook before generation. It performs no network request and no extra
 * model call, preserving the existing Cost Guard request model.
 *
 * This module must never be imported by client components.
 */

import { buildFinanceIntelligencePlan } from "../finance/intelligence";
import type {
  DivBrainProviderContextBlock,
  DivBrainProviderMessage,
  DivBrainProviderRequest,
} from "./types";

export type DivBrainGatewayPromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const CONTEXT_KIND_LABELS: Record<
  DivBrainProviderContextBlock["kind"],
  string
> = {
  identity: "Identity",
  policy: "Policy",
  response_format: "Response format",
  sources: "Sources",
  knowledge: "Knowledge",
  user_request: "User request",
  user_owned_context: "User-owned context",
  tool_result: "Tool result",
  freshness_warning: "Freshness warning",
  other: "Other",
};

function formatContextBlocks(
  blocks: readonly DivBrainProviderContextBlock[],
): string {
  return blocks
    .map((block) => {
      const label = CONTEXT_KIND_LABELS[block.kind] ?? "Other";
      return `[${label}]\n${block.content}`;
    })
    .join("\n\n");
}

function mapConversationMessage(
  message: DivBrainProviderMessage,
): DivBrainGatewayPromptMessage | null {
  if (message.role === "system") {
    return { role: "system", content: message.content };
  }

  if (message.role === "user" || message.role === "assistant") {
    return { role: message.role, content: message.content };
  }

  return null;
}

function latestUserMessage(messages: readonly DivBrainGatewayPromptMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" && message.content.trim()) {
      return message.content;
    }
  }
  return null;
}

/**
 * Build AI SDK `system` + `messages` from a validated DivBrain request.
 * Returns null when no user/assistant conversation messages remain.
 */
export function mapDivBrainRequestToGatewayPrompt(
  request: DivBrainProviderRequest,
): {
  system?: string;
  messages: DivBrainGatewayPromptMessage[];
} | null {
  const systemFromBlocks =
    request.contextBlocks.length > 0
      ? formatContextBlocks(request.contextBlocks)
      : undefined;

  const conversation: DivBrainGatewayPromptMessage[] = [];
  const extraSystem: string[] = [];

  for (const message of request.messages) {
    const mapped = mapConversationMessage(message);
    if (!mapped) continue;
    if (mapped.role === "system") {
      extraSystem.push(mapped.content);
      continue;
    }
    conversation.push(mapped);
  }

  if (conversation.length === 0) return null;

  const currentUserMessage = latestUserMessage(conversation);
  const financePlan = currentUserMessage
    ? buildFinanceIntelligencePlan(currentUserMessage)
    : null;

  const systemParts = [
    ...(systemFromBlocks ? [systemFromBlocks] : []),
    ...(financePlan
      ? [
          `[Finance specialist context — ${financePlan.version}]\n${financePlan.context}`,
        ]
      : []),
    ...extraSystem,
  ];

  return {
    ...(systemParts.length > 0 ? { system: systemParts.join("\n\n") } : {}),
    messages: conversation,
  };
}
