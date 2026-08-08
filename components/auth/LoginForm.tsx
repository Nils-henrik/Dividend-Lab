"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PrimaryButton from "@/components/ui/Button";
import { getSafeAuthErrorMessage } from "@/lib/auth/error-messages";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  redirectTo: string;
  resetSuccess?: boolean;
  registrationPending?: boolean;
};

export default function LoginForm({
  redirectTo,
  resetSuccess = false,
  registrationPending = false,
}: Props) {
  const router = useRouter();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setError(getSafeAuthErrorMessage(signInError.message));
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <section className="divlab-card w-full max-w-md rounded-3xl p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="mb-8">
        <p className="mb-3 divlab-section-label">{DIVLAB_BRAND_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-divlab-text">
          Logga in
        </h1>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Få tillgång till verktyg, forum, kommentarer, kontakter och din
          personliga DivLab-miljö.
        </p>
      </div>

      {registrationPending && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-divlab-blue/20 bg-divlab-blue/5 px-4 py-3"
        >
          <p className="text-sm font-medium text-divlab-text">
            Kontot är skapat
          </p>
          <p className="mt-1 text-sm leading-6 text-divlab-text-secondary">
            Verifiera först din e-post via länken i välkomstmejlet. Därefter kan
            du logga in här med din e-post och ditt lösenord.
          </p>
        </div>
      )}

      {resetSuccess && (
        <p className="mb-5 rounded-xl border border-divlab-blue/20 bg-divlab-blue/5 px-4 py-3 text-sm leading-6 text-divlab-text-secondary">
          Ditt lösenord är uppdaterat. Logga in med ditt nya lösenord.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="divlab-input w-full px-4 py-3"
          />
        </label>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
              Lösenord
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className="divlab-input w-full px-4 py-3 pr-24"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-2 my-auto inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium text-divlab-text-muted transition hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                {showPassword ? "Dölj" : "Visa"}
              </button>
            </div>
          </label>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="divlab-link text-sm font-medium">
              Glömt lösenord?
            </Link>
          </div>
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-3 text-sm leading-6 text-divlab-text-secondary"
          >
            {error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Loggar in..." : "Logga in"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-divlab-text-muted">
        Ny på {DIVLAB_BRAND_NAME}?{" "}
        <Link href="/register" className="divlab-link font-medium">
          Skapa konto
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-divlab-text-muted">
        <Link href="/" className="divlab-link">
          Till startsidan
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/news" className="divlab-link">
          Börsnyheter
        </Link>
      </p>
    </section>
  );
}
