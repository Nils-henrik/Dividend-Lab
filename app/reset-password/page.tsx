"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import PrimaryButton from "@/components/ui/Button";
import { clearRecoveryPendingCookie, markRecoveryPendingCookie } from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/client";

const INVALID_LINK_MESSAGE =
  "Länken för att återställa lösenordet är ogiltig eller har gått ut.";

const MISSING_SESSION_MESSAGE =
  "Öppna länken från e-postmeddelandet för att välja ett nytt lösenord.";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isRecoverySessionReady, setIsRecoverySessionReady] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let authTimeout: number | undefined;
    let unsubscribe: (() => void) | undefined;

    async function initializeRecoverySession() {
      const params = new URLSearchParams(window.location.search);

      if (params.get("error")) {
        if (!isMounted) {
          return;
        }

        setError(INVALID_LINK_MESSAGE);
        setIsCheckingSession(false);
        return;
      }

      const supabase = createClient();
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (!isMounted) {
          return;
        }

        if (exchangeError) {
          setError(INVALID_LINK_MESSAGE);
          setIsCheckingSession(false);
          return;
        }

        window.history.replaceState({}, "", "/reset-password");
        markRecoveryPendingCookie();
      }

      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (data.session) {
        markRecoveryPendingCookie();
        setIsRecoverySessionReady(true);
        setIsCheckingSession(false);
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) {
          return;
        }

        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          window.clearTimeout(authTimeout);
          markRecoveryPendingCookie();
          setIsRecoverySessionReady(true);
          setIsCheckingSession(false);
          setError("");
        }
      });

      unsubscribe = () => subscription.unsubscribe();

      authTimeout = window.setTimeout(() => {
        if (!isMounted) {
          return;
        }

        setError(MISSING_SESSION_MESSAGE);
        setIsCheckingSession(false);
      }, 2500);
    }

    void initializeRecoverySession();

    return () => {
      isMounted = false;
      window.clearTimeout(authTimeout);
      unsubscribe?.();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

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
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setIsLoading(false);
      setIsRecoverySessionReady(false);
      setError(
        "Din återställningssession saknas eller har gått ut. Be om en ny länk och försök igen.",
      );
      return;
    }

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

    clearRecoveryPendingCookie();
    await supabase.auth.signOut();
    router.replace("/login?reset=success");
    router.refresh();
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

        {isCheckingSession ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
            Kontrollerar återställningslänken...
          </p>
        ) : isRecoverySessionReady ? (
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

            <PrimaryButton type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Uppdaterar..." : "Uppdatera lösenord"}
            </PrimaryButton>
          </form>
        ) : (
          <div className="space-y-5">
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
              {error}
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex w-full justify-center rounded-xl border border-[#D4AF37]/40 px-8 py-4 text-lg font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Be om en ny länk
            </Link>
          </div>
        )}

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
