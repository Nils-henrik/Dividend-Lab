"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import PrimaryButton from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!password) {
      setError("Ange ett nytt lösenord.");
      return;
    }

    if (password.length < 6) {
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

    if (updateError) {
      setIsLoading(false);
      setError(
        "Det gick inte att uppdatera lösenordet. Öppna länken från e-postmeddelandet igen och försök på nytt.",
      );
      return;
    }

    await supabase.auth.signOut();
    setIsLoading(false);
    setPassword("");
    setConfirmPassword("");
    setSuccessMessage(
      "Ditt lösenord är uppdaterat. Du kan nu logga in med ditt nya lösenord.",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="mb-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
            Dividend Lab
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            Välj nytt lösenord
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Ange ett nytt lösenord för ditt konto. När lösenordet är uppdaterat
            kan du logga in igen i lugn och ro.
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
              minLength={6}
              required
              className="w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
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
              minLength={6}
              required
              className="w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
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

          <PrimaryButton type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Uppdaterar..." : "Uppdatera lösenord"}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Redo att fortsätta?{" "}
          <Link
            href="/login"
            className="font-medium text-[#D4AF37] transition hover:text-[#F9D976]"
          >
            Logga in
          </Link>
        </p>
      </section>
    </main>
  );
}
