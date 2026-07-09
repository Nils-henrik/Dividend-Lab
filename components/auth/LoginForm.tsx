"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PrimaryButton from "@/components/ui/Button";

type Props = {
  redirectTo: string;
  resetSuccess?: boolean;
};

export default function LoginForm({ redirectTo, resetSuccess = false }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Ange e-post och lösenord för att fortsätta.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError("Ange en giltig e-postadress.");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <section className="divlab-card w-full max-w-md rounded-3xl p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="mb-8">
        <p className="mb-3 divlab-section-label">Dividend Lab</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-divlab-text">
          Logga in
        </h1>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Få åtkomst till din portfölj, kontoinställningar och community-funktioner.
        </p>
      </div>

      {resetSuccess && (
        <p className="mb-5 rounded-xl border border-divlab-blue/20 bg-divlab-blue/5 px-4 py-3 text-sm leading-6 text-divlab-text-secondary">
          Ditt lösenord är uppdaterat. Logga in med ditt nya lösenord.
        </p>
      )}

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
            }}
            autoComplete="email"
            required
            className="divlab-input w-full px-4 py-3"
          />
        </label>

        <div className="space-y-3">
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
              }}
              autoComplete="current-password"
              required
              className="divlab-input w-full px-4 py-3"
            />
          </label>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="divlab-link text-sm font-medium">
              Glömt lösenord?
            </Link>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-3 text-sm leading-6 text-divlab-text-secondary">
            {error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Loggar in..." : "Logga in"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-divlab-text-muted">
        Ny på Dividend Lab?{" "}
        <Link href="/register" className="divlab-link font-medium">
          Skapa konto
        </Link>
      </p>
    </section>
  );
}
