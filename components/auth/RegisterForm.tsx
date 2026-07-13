"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { registerUser } from "@/app/register/actions";
import PrimaryButton from "@/components/ui/Button";
import { LEGAL_ACCEPTANCE_VALIDATION_MESSAGE } from "@/lib/legal/acceptance";

type Props = {
  redirectTo: string;
};

export default function RegisterForm({ redirectTo }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      setError("Ange en giltig e-postadress.");
      return;
    }

    if (password.length < 6) {
      setError("Använd minst 6 tecken i lösenordet.");
      return;
    }

    if (!legalAccepted) {
      setError(LEGAL_ACCEPTANCE_VALIDATION_MESSAGE);
      return;
    }

    setIsLoading(true);

    const result = await registerUser({
      email: normalizedEmail,
      password,
      legalAcceptanceConfirmed: legalAccepted,
      redirectTo,
    });

    setIsLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccessMessage(
        "Bekräfta ditt konto via e-post och logga sedan in på Dividend Lab.",
      );
      return;
    }

    setSuccessMessage(
      "Ditt konto är klart. Du kan nu öppna din Dividend Lab-miljö.",
    );
  }

  return (
    <section className="divlab-card w-full max-w-md rounded-3xl p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="mb-8">
        <p className="mb-3 divlab-section-label">Dividend Lab</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-divlab-text">
          Skapa konto
        </h1>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Registrera dig med e-post och lösenord för att börja bygga din
          långsiktiga investeringsmiljö.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            E-post
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
              setSuccessMessage("");
            }}
            autoComplete="email"
            required
            className="divlab-input w-full px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Lösenord
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
              setSuccessMessage("");
            }}
            autoComplete="new-password"
            minLength={6}
            required
            className="divlab-input w-full px-4 py-3"
          />
        </label>

        <div className="flex items-start gap-3">
          <input
            id="legal-acceptance"
            type="checkbox"
            checked={legalAccepted}
            onChange={(event) => {
              setLegalAccepted(event.target.checked);
              setError("");
              setSuccessMessage("");
            }}
            className="mt-1 h-4 w-4 shrink-0 rounded border divlab-border-neutral bg-divlab-surface text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
          />
          <label
            htmlFor="legal-acceptance"
            className="text-sm leading-6 text-divlab-text-secondary"
          >
            Jag accepterar{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="divlab-link font-medium"
            >
              användarvillkoren
            </Link>{" "}
            och bekräftar att jag har läst{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="divlab-link font-medium"
            >
              integritetspolicyn
            </Link>
            .
          </label>
        </div>

        {error && (
          <p className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-3 text-sm leading-6 text-divlab-text-secondary">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="rounded-xl border border-divlab-blue/20 bg-divlab-blue/5 px-4 py-3 text-sm leading-6 text-divlab-text-secondary">
            {successMessage}
          </p>
        )}

        <PrimaryButton type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Skapar konto..." : "Skapa konto"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-divlab-text-muted">
        Har du redan ett konto?{" "}
        <Link href="/login" className="divlab-link font-medium">
          Logga in
        </Link>
      </p>
    </section>
  );
}
