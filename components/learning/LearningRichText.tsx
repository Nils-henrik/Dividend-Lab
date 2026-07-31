import Link from "next/link";
import type { ReactNode } from "react";

const LINK_PATTERN = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;

const linkClassName =
  "divlab-link font-medium underline decoration-divlab-blue/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40";

/**
 * Renders Learning paragraph text with optional internal markdown links:
 * `[label](/path)`. Only same-origin paths starting with `/` are supported.
 */
export function LearningRichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  LINK_PATTERN.lastIndex = 0;

  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(
      <Link key={`learning-link-${key}`} href={match[2]} className={linkClassName}>
        {match[1]}
      </Link>,
    );
    key += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes.length > 0 ? nodes : text}</>;
}
