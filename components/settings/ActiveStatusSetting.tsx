"use client";

import { useState, useTransition } from "react";
import { setShareActiveStatusAction } from "@/app/settings/actions";

type Props = {
  initialEnabled: boolean;
};

export default function ActiveStatusSetting({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await setShareActiveStatusAction(next);
      setEnabled(result.enabled);
      setStatus(result.status);
      setMessage(result.message);
    });
  }

  return (
    <section className="divlab-card rounded-3xl p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-divlab-text">
          Aktivitetsstatus
        </h3>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          Välj om dina DivLab-kontakter ska kunna se när du är aktiv. Om
          inställningen är av stängs både den gröna statuspricken och
          senast-aktiv-texten av för andra.
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Visa när jag är aktiv"
        disabled={isPending}
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border divlab-border-neutral bg-white/[0.02] px-4 py-3 text-left transition hover:border-divlab-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:opacity-60"
      >
        <span>
          <span className="block text-sm font-medium text-divlab-text">
            Visa när jag är aktiv
          </span>
          <span className="mt-1 block text-xs text-divlab-text-muted">
            {enabled
              ? "Kontakter kan se om du är aktiv just nu."
              : "Din aktivitetsstatus är dold för kontakter."}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 rounded-full transition ${
            enabled ? "bg-divlab-blue" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
              enabled ? "left-5" : "left-0.5"
            }`}
          />
        </span>
      </button>

      {message ? (
        <p
          role="status"
          className={`mt-4 text-sm ${
            status === "error" ? "text-red-300" : "text-divlab-text-secondary"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}