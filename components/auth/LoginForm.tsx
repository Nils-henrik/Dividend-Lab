"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { signInWithIdentifier } from "@/app/login/actions";
import PrimaryButton from "@/components/ui/Button";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  redirectTo: string;
  resetSuccess?: boolean;
};

export default function LoginForm({ redirectTo, resetSuccess = false }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Ange e-post eller användarnamn och lösenord för att fortsätta.");
      return;
    }

    setIsLoading(true);

    const result = await signInWithIdentifier({
      identifier,
      password,
    });

    setIsLoading(false);

    if (!result.ok) {
      setError(result.message);
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
            E-post eller användarnamn
          </span>
          <input
            type="text"
            name="identifier"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setError("");
            }}
            autoComplete="username"
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
        Ny på {DIVLAB_BRAND_NAME}?{" "}
        <Link href="/register" className="divlab-link font-medium">
          Skapa konto
        </Link>
      </p>
    </section>
  );
}
