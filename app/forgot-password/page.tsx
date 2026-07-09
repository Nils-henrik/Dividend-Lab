"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { requestPasswordReset } from "@/app/forgot-password/actions";
import PrimaryButton from "@/components/ui/Button";

const GENERIC_RESET_ERROR =
  "Det gick inte att skicka instruktionerna just nu. Försök igen om en stund.";

const RATE_LIMIT_RESET_ERROR =
  "För många återställningsmail har skickats på kort tid. Vänta en stund och försök igen.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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

    setIsLoading(true);

    try {
      const result = await requestPasswordReset(normalizedEmail);

      if (!result.ok) {
        setError(
          result.reason === "rate_limit"
            ? RATE_LIMIT_RESET_ERROR
            : GENERIC_RESET_ERROR,
        );
        return;
      }

      setSuccessMessage(
        "Om kontot finns skickar vi instruktioner till e-postadressen.",
      );
    } catch (submitError) {
      console.error("[password-reset] forgot-password submit failed", {
        message:
          submitError instanceof Error ? submitError.message : "unknown_error",
      });
      setError(GENERIC_RESET_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-divlab-bg px-6 py-12 text-divlab-text">
      <section className="divlab-card w-full max-w-md rounded-3xl p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="mb-8">
          <p className="mb-3 divlab-section-label">Dividend Lab</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-divlab-text">
            Återställ lösenord
          </h1>
          <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
            Ange e-postadressen som är kopplad till ditt konto.
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
            {isLoading ? "Skickar..." : "Skicka instruktioner"}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-divlab-text-muted">
          Kommer du ihåg lösenordet?{" "}
          <Link href="/login" className="divlab-link font-medium">
            Logga in
          </Link>
        </p>
      </section>
    </main>
  );
}
