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
    <section className="rounded-3xl border border-white/10 bg-[#161616] p-8 shadow-[0_0_80px_rgba(212,175,55,0.05)]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Byt lösenord</h3>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Uppdatera lösenordet för ditt konto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
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
            className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
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
            className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3 text-sm leading-6 text-gray-300">
            {successMessage}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[#D4AF37] bg-[#D4AF37] px-6 text-sm font-semibold text-black shadow-[0_0_20px_rgba(212,175,55,0.14)] transition-all duration-300 hover:bg-[#F5D77A] hover:shadow-[0_0_28px_rgba(212,175,55,0.2)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isLoading ? "Sparar..." : "Uppdatera lösenord"}
          </button>
        </div>
      </form>
    </section>
  );
}
