import { formatDivBrainMessageTimestamp } from "@/lib/divbrain/dates";
import type {
  DivBrainShellTranscriptItem,
  DivBrainShellTranscriptView,
} from "@/lib/divbrain/server/ui";

type Props = {
  transcript: DivBrainShellTranscriptView;
};

export default function DivBrainTranscript({ transcript }: Props) {
  if (transcript.status === "data_unavailable") {
    return (
      <div className="flex flex-1 items-center px-5 py-8 sm:px-6">
        <p className="text-sm leading-6 text-divlab-text-secondary">
          Transkriptet kunde inte laddas just nu.
        </p>
      </div>
    );
  }

  if (transcript.status === "empty") {
    return (
      <div className="flex flex-1 items-center px-5 py-8 sm:px-6">
        <p className="max-w-xl text-sm leading-6 text-divlab-text-secondary">
          Den här konversationen har inga meddelanden ännu. Frågefunktionen
          öppnas i nästa steg.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
      {transcript.historyTruncated ? (
        <p
          className="mb-4 rounded-xl border divlab-border-neutral bg-divlab-elevated/50 px-3 py-2 text-xs leading-5 text-divlab-text-muted"
          role="status"
        >
          Äldre meddelanden visas inte i den här Alpha-vyn.
        </p>
      ) : null}

      <ol className="mx-auto flex max-w-[42rem] list-none flex-col gap-4">
        {transcript.items.map((item) => (
          <li key={item.id}>
            <DivBrainMessageItem item={item} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function DivBrainMessageItem({ item }: { item: DivBrainShellTranscriptItem }) {
  const timestamp = formatDivBrainMessageTimestamp(item.createdAt);

  if (item.kind === "user_message") {
    return (
      <article className="ml-auto max-w-[90%] rounded-2xl border border-divlab-blue/20 bg-divlab-blue/10 px-4 py-3">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text">
          {item.content}
        </p>
        <time
          className="mt-2 block text-[11px] tabular-nums text-divlab-text-muted"
          dateTime={item.createdAt}
        >
          {timestamp}
        </time>
      </article>
    );
  }

  if (item.kind === "assistant_message") {
    return (
      <article className="mr-auto max-w-[90%] rounded-2xl border divlab-border-neutral bg-divlab-elevated px-4 py-3">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-divlab-text-muted">
          DivBrain
        </p>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text">
          {item.content}
        </p>
        <time
          className="mt-2 block text-[11px] tabular-nums text-divlab-text-muted"
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
