"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PrimaryButton from "@/components/ui/Button";

type Props = {
  redirectTo: string;
};

export default function LoginForm({ redirectTo }: Props) {
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
      setError("Enter your email and password to continue.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError("Enter a valid email address.");
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
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Dividend Lab
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
          Log in
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Access your portfolio workspace, account settings and authenticated
          community actions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
            Email
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
            className="w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
            Password
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
            className="w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
            {error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Signing in..." : "Sign in"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        New to Dividend Lab?{" "}
        <Link
          href="/register"
          className="font-medium text-[#D4AF37] transition hover:text-[#F9D976]"
        >
          Create an account
        </Link>
      </p>
    </section>
  );
}
