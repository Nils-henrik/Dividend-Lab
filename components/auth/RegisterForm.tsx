"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PrimaryButton from "@/components/ui/Button";

type Props = {
  redirectTo: string;
};

export default function RegisterForm({ redirectTo }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    setIsLoading(true);

    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      redirectTo,
    )}`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo,
      },
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      setSuccessMessage(
        "Ditt konto är klart. Du kan nu öppna din Dividend Lab-miljö.",
      );
      return;
    }

    setSuccessMessage(
      "Bekräfta ditt konto via e-post och logga sedan in på Dividend Lab.",
    );
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Dividend Lab
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
          Skapa konto
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Registrera dig med e-post och lösenord för att börja bygga din
          långsiktiga investeringsmiljö.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
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
            className="w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
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
          {isLoading ? "Skapar konto..." : "Skapa konto"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Har du redan ett konto?{" "}
        <Link
          href="/login"
          className="font-medium text-[#D4AF37] transition hover:text-[#F9D976]"
        >
          Logga in
        </Link>
      </p>
    </section>
  );
}
