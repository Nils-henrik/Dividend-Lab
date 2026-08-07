"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { registerUser } from "@/app/register/actions";
import PrimaryButton from "@/components/ui/Button";
import { LEGAL_ACCEPTANCE_VALIDATION_MESSAGE } from "@/lib/legal/acceptance";
import { validateUsername } from "@/lib/profiles/username";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  redirectTo: string;
};

export default function RegisterForm({ redirectTo }: Props) {
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const usernameResult = validateUsername(username, { required: true });

    if (!normalizedEmail.includes("@")) {
      setError("Ange en giltig e-postadress.");
      return;
    }

    if (!usernameResult.ok) {
      setError(usernameResult.error);
      return;
    }

    if (password.length < 8) {
      setError("Använd minst 8 tecken i lösenordet.");
      return;
    }

    if (!legalAccepted) {
      setError(LEGAL_ACCEPTANCE_VALIDATION_MESSAGE);
      return;
    }

    setIsLoading(true);

    const result = await registerUser({
      email: normalizedEmail,
      password,
      username: usernameResult.username,
      legalAcceptanceConfirmed: legalAccepted,
      redirectTo,
    });

    setIsLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccessMessage(
        "Bekräfta ditt konto via e-post och logga sedan in på DivLab.",
      );
      return;
    }

    setSuccessMessage(
      "Ditt konto är klart. Du kan nu öppna din DivLab-miljö.",
    );
  }

  return (
    <section className="divlab-card w-full max-w-md rounded-3xl p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="mb-8">
        <p className="mb-3 divlab-section-label">{DIVLAB_BRAND_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-divlab-text">
          Skapa konto
        </h1>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Få tillgång till forum, kommentarer, kontakter, meddelanden och din
          personliga DivLab-miljö. DivLab är för närvarande en kostnadsfri beta.
        </p>
      </div>

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
              setSuccessMessage("");
            }}
            autoComplete="email"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="divlab-input w-full px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Användarnamn
          </span>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-divlab-text-muted"
            >
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
                setSuccessMessage("");
              }}
              autoComplete="username"
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]{3,20}"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="divlab-input w-full py-3 pl-9 pr-4"
            />
          </div>
          <span className="mt-2 block text-xs leading-5 text-divlab-text-muted">
            Ditt offentliga namn på DivLab. 3–20 tecken: a–z, 0–9 eller _.
          </span>
        </label>

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
                setSuccessMessage("");
              }}
              autoComplete="new-password"
              minLength={8}
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
          <span className="mt-2 block text-xs leading-5 text-divlab-text-muted">
            Minst 8 tecken.
          </span>
        </label>

        <div className="flex items-start gap-3">
          <input
            id="legal-acceptance"
            type="checkbox"
            checked={legalAccepted}
            onChange={(event) => {
              setLegalAccepted(event.target.checked);
              setError("");
              setSuccessMessage("");
            }}
            className="mt-1 h-4 w-4 shrink-0 rounded border divlab-border-neutral bg-divlab-surface text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
          />
          <label
            htmlFor="legal-acceptance"
            className="text-sm leading-6 text-divlab-text-secondary"
          >
            Jag accepterar{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="divlab-link font-medium"
            >
              användarvillkoren
            </Link>{" "}
            och bekräftar att jag har läst{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="divlab-link font-medium"
            >
              integritetspolicyn
            </Link>
            .
          </label>
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

        {successMessage && (
          <p
            role="status"
            className="rounded-xl border border-divlab-blue/20 bg-divlab-blue/5 px-4 py-3 text-sm leading-6 text-divlab-text-secondary"
          >
            {successMessage}
          </p>
        )}

        <PrimaryButton type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Skapar konto..." : "Skapa konto"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-divlab-text-muted">
        Har du redan ett konto?{" "}
        <Link href="/login" className="divlab-link font-medium">
          Logga in
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-divlab-text-muted">
        <Link href="/" className="divlab-link">
          Till startsidan
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/frihetsmaskinen" className="divlab-link">
          Frihetsmaskinen
        </Link>
      </p>
    </section>
  );
}
