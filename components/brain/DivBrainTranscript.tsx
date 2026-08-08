"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatDivBrainMessageTimestamp } from "@/lib/divbrain/dates";
import type {
  DivBrainShellTranscriptItem,
  DivBrainShellTranscriptSource,
  DivBrainShellTranscriptView,
} from "@/lib/divbrain/ui-types";
import scrollStyles from "./DivBrainScrollArea.module.css";

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
      className={`${scrollStyles.scrollArea} min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-4 py-5 sm:px-6 sm:py-6`}
    >
      <div className="mx-auto flex min-h-full max-w-[50rem] flex-col justify-end">
        {transcript.status === "data_unavailable" ? (
          <div className="flex flex-1 items-center justify-center py-8 text-center">
            <p className="text-sm leading-6 text-divlab-text-secondary">
              Transkriptet kunde inte laddas just nu.
            </p>
          </div>
        ) : null}

        {transcript.status === "empty" && !optimisticUserMessage ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-divlab-blue/20 bg-divlab-blue/10 text-xl text-divlab-blue" aria-hidden="true">
              ✦
            </div>
            <p className="mt-4 text-base font-medium text-divlab-text">
              Vad vill du förstå bättre?
            </p>
            <p className="mt-1 max-w-md text-sm leading-6 text-divlab-text-muted">
              Fråga om börsen, fonder, sparande eller privatekonomi.
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

        <ol className="list-none space-y-7" aria-live="polite">
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
    <article className="ml-auto w-fit max-w-[88%] rounded-[1.35rem] border border-divlab-blue/15 bg-divlab-blue/15 px-4 py-3 shadow-sm sm:max-w-[76%]">
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text">
        {message.content}
      </p>
      <span className="sr-only">Meddelandet skickas</span>
    </article>
  );
}

function DivBrainThinkingState() {
  return (
    <article className="mr-auto flex max-w-[90%] gap-3 py-1" role="status">
      <DivBrainAvatar />
      <div className="min-w-0 pt-0.5">
        <p className="text-xs font-semibold text-divlab-text-secondary">DivBrain</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-divlab-text-muted">
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:140ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:280ms]" />
          </span>
          <span>Tänker…</span>
        </div>
      </div>
    </article>
  );
}

function DivBrainAvatar() {
  return (
    <span
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-divlab-blue/25 bg-divlab-blue/10 text-divlab-blue"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path d="M8.5 5.5a3 3 0 0 0-3 3v.5a3 3 0 0 0 0 6v.5a3 3 0 0 0 3 3M15.5 5.5a3 3 0 0 1 3 3v.5a3 3 0 0 1 0 6v.5a3 3 0 0 1-3 3M9 4.5v15M15 4.5v15M9 8h2.5M12.5 12H15M9 16h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function DivBrainMessageItem({ item }: { item: DivBrainShellTranscriptItem }) {
  const timestamp = formatDivBrainMessageTimestamp(item.createdAt);

  if (item.kind === "user_message") {
    return (
      <article className="ml-auto w-fit max-w-[88%] rounded-[1.35rem] border border-divlab-blue/15 bg-divlab-blue/15 px-4 py-3 shadow-sm sm:max-w-[76%]">
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
      <article className="mr-auto flex w-full max-w-[46rem] gap-3 py-1">
        <DivBrainAvatar />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-semibold text-divlab-text-secondary">DivBrain</p>
            <time
              className="text-[10px] tabular-nums text-divlab-text-muted"
              dateTime={item.createdAt}
            >
              {timestamp}
            </time>
          </div>
          <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-divlab-text">
            {item.content}
          </p>
          {item.sources && item.sources.length > 0 ? (
            <DivBrainTranscriptSources sources={item.sources} />
          ) : null}
        </div>
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
    <div className="mt-4 max-w-xl rounded-xl border divlab-border-neutral bg-divlab-elevated/45 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">
        Källor
      </p>
      <ol className="mt-2 space-y-2 text-xs leading-5 text-divlab-text-secondary">
        {sources.map((source, index) => (
          <li key={source.id} className="flex min-w-0 gap-2.5">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-divlab-blue/10 text-[10px] font-medium tabular-nums text-divlab-blue"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <DivBrainSourceLink source={source} />
              {source.publisher || source.attribution ? (
                <p className="mt-0.5 truncate text-[10px] text-divlab-text-muted">
                  {[source.publisher, source.attribution]
                    .filter(Boolean)
                    .filter((value, valueIndex, values) => values.indexOf(value) === valueIndex)
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
    "break-words font-medium text-divlab-text-secondary underline decoration-divlab-border underline-offset-2 transition hover:text-divlab-text hover:decoration-current";

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

  return <span className="font-medium text-divlab-text-secondary">{source.title}</span>;
}
