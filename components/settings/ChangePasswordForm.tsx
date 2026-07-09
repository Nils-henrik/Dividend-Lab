"use client";

import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Använd minst 6 tecken för ditt nya lösenord.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setIsLoading(false);

    if (updateError) {
      setError(
        "Det gick inte att uppdatera lösenordet just nu. Försök igen om en stund.",
      );
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccessMessage("Lösenordet har uppdaterats.");
  }

  return (
    <section className="divlab-card rounded-3xl p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-divlab-text">Byt lösenord</h3>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          Uppdatera lösenordet för ditt konto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Nytt lösenord
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
            minLength={MIN_PASSWORD_LENGTH}
            required
            className="divlab-input w-full px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Bekräfta nytt lösenord
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
              setSuccessMessage("");
            }}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
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

        <div className="flex flex-col sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="divlab-btn-primary h-11 w-full px-6 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isLoading ? "Sparar..." : "Uppdatera lösenord"}
          </button>
        </div>
      </form>
    </section>
  );
}
