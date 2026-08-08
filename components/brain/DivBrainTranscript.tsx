"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatDivBrainMessageTimestamp } from "@/lib/divbrain/dates";
import type {
  DivBrainShellTranscriptItem,
  DivBrainShellTranscriptSource,
  DivBrainShellTranscriptView,
} from "@/lib/divbrain/ui-types";

export type DivBrainOptimisticUserMessage = {
  id: string;
  content: string;
  createdAt: string;
};

type Props = {
  transcript: DivBrainShellTranscriptView;
  optimisticUserMessage?: DivBrainOptimisticUserMessage | null;
  showThinking?: boolean;
};

export default function DivBrainTranscript({
  transcript,
  optimisticUserMessage = null,
  showThinking = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemCount = transcript.status === "ready" ? transcript.items.length : 0;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: optimisticUserMessage || showThinking ? "smooth" : "auto",
    });
  }, [itemCount, optimisticUserMessage, showThinking]);

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-4 py-5 sm:px-6"
    >
      <div className="mx-auto flex min-h-full max-w-[48rem] flex-col justify-end">
        {transcript.status === "data_unavailable" ? (
          <div className="flex flex-1 items-center py-8">
            <p className="text-sm leading-6 text-divlab-text-secondary">
              Transkriptet kunde inte laddas just nu.
            </p>
          </div>
        ) : null}

        {transcript.status === "empty" && !optimisticUserMessage ? (
          <div className="flex flex-1 items-center py-8">
            <p className="max-w-xl text-sm leading-6 text-divlab-text-secondary">
              Ställ en fråga nedan för att börja.
            </p>
          </div>
        ) : null}

        {transcript.status === "ready" && transcript.historyTruncated ? (
          <p
            className="mb-5 rounded-xl border divlab-border-neutral bg-divlab-elevated/50 px-3 py-2 text-xs leading-5 text-divlab-text-muted"
            role="status"
          >
            Äldre meddelanden visas inte i den här Alpha-vyn.
          </p>
        ) : null}

        <ol className="list-none space-y-6" aria-live="polite">
          {transcript.status === "ready"
            ? transcript.items.map((item) => (
                <li key={item.id}>
                  <DivBrainMessageItem item={item} />
                </li>
              ))
            : null}

          {optimisticUserMessage ? (
            <li key={optimisticUserMessage.id}>
              <OptimisticUserMessage message={optimisticUserMessage} />
            </li>
          ) : null}

          {showThinking ? (
            <li>
              <DivBrainThinkingState />
            </li>
          ) : null}
        </ol>
      </div>
    </div>
  );
}

function OptimisticUserMessage({
  message,
}: {
  message: DivBrainOptimisticUserMessage;
}) {
  return (
    <article className="ml-auto w-fit max-w-[88%] rounded-3xl bg-divlab-blue/10 px-4 py-3 sm:max-w-[78%]">
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text">
        {message.content}
      </p>
      <span className="sr-only">Meddelandet skickas</span>
    </article>
  );
}

function DivBrainThinkingState() {
  return (
    <article className="mr-auto max-w-[90%] py-1" role="status">
      <p className="mb-2 text-xs font-semibold text-divlab-text-secondary">
        DivBrain
      </p>
      <div className="flex items-center gap-2 text-sm text-divlab-text-muted">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:140ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:280ms]" />
        </span>
        <span>DivBrain tänker…</span>
      </div>
    </article>
  );
}

function DivBrainMessageItem({ item }: { item: DivBrainShellTranscriptItem }) {
  const timestamp = formatDivBrainMessageTimestamp(item.createdAt);

  if (item.kind === "user_message") {
    return (
      <article className="ml-auto w-fit max-w-[88%] rounded-3xl bg-divlab-blue/10 px-4 py-3 sm:max-w-[78%]">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text">
          {item.content}
        </p>
        <time
          className="mt-1.5 block text-right text-[10px] tabular-nums text-divlab-text-muted"
          dateTime={item.createdAt}
        >
          {timestamp}
        </time>
      </article>
    );
  }

  if (item.kind === "assistant_message") {
    return (
      <article className="mr-auto w-full max-w-[44rem] py-1">
        <p className="mb-2 text-xs font-semibold text-divlab-text-secondary">
          DivBrain
        </p>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text">
          {item.content}
        </p>
        {item.sources && item.sources.length > 0 ? (
          <DivBrainTranscriptSources sources={item.sources} />
        ) : null}
        <time
          className="mt-2 block text-[10px] tabular-nums text-divlab-text-muted"
          dateTime={item.createdAt}
        >
          {timestamp}
        </time>
      </article>
    );
  }

  const tone =
    item.kind === "cancelled" || item.kind === "incomplete"
      ? "border-divlab-border bg-divlab-elevated/60 text-divlab-text-muted"
      : item.kind === "failed" || item.kind === "unavailable"
        ? "border-divlab-border bg-divlab-elevated text-divlab-text-secondary"
        : "border-divlab-blue/20 bg-divlab-blue/5 text-divlab-text-secondary";

  const label =
    item.kind === "provider_unavailable"
      ? "AI-motor otillgänglig"
      : item.kind === "failed"
        ? "Misslyckades"
        : item.kind === "cancelled"
          ? "Avbruten"
          : item.kind === "incomplete"
            ? "Ej slutförd"
            : item.kind === "blocked"
              ? "Kunde inte visas"
              : "Otillgänglig";

  return (
    <article
      className={`mr-auto max-w-[90%] rounded-2xl border px-4 py-3 ${tone}`}
      role="status"
    >
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em]">
        {label}
      </p>
      <p className="text-sm leading-6">{item.message}</p>
      <time
        className="mt-2 block text-[11px] tabular-nums opacity-80"
        dateTime={item.createdAt}
      >
        {timestamp}
      </time>
    </article>
  );
}

function DivBrainTranscriptSources({
  sources,
}: {
  sources: readonly DivBrainShellTranscriptSource[];
}) {
  return (
    <div className="mt-4 border-t divlab-border-neutral pt-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-divlab-text-muted">
        Källor
      </p>
      <ol className="mt-2 space-y-1.5 text-xs leading-5 text-divlab-text-secondary">
        {sources.map((source, index) => (
          <li key={source.id} className="flex min-w-0 gap-2">
            <span
              className="shrink-0 tabular-nums text-divlab-text-muted"
              aria-hidden="true"
            >
              [{index + 1}]
            </span>
            <div className="min-w-0">
              <DivBrainSourceLink source={source} />
              {source.publisher || source.attribution ? (
                <p className="truncate text-[11px] text-divlab-text-muted">
                  {[source.publisher, source.attribution]
                    .filter(Boolean)
                    .filter((value, valueIndex, values) =>
                      values.indexOf(value) === valueIndex,
                    )
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DivBrainSourceLink({
  source,
}: {
  source: DivBrainShellTranscriptSource;
}) {
  const className =
    "break-words font-medium text-divlab-text underline decoration-divlab-border underline-offset-2 transition hover:decoration-current";

  if (source.internalRoute) {
    return (
      <Link href={source.internalRoute} className={className}>
        {source.title}
      </Link>
    );
  }

  if (source.canonicalUrl) {
    return (
      <a
        href={source.canonicalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {source.title}
        <span className="sr-only"> (öppnas i ny flik)</span>
      </a>
    );
  }

  return <span className="font-medium text-divlab-text">{source.title}</span>;
}
