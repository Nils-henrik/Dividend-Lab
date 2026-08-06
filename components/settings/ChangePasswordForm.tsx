"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/app/settings/actions";

const idleState: ChangePasswordState = {
  status: "idle",
  message: "",
};

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    idleState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section className="divlab-card rounded-3xl p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-divlab-text">Byt lösenord</h3>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          Ange ditt nuvarande lösenord och välj ett nytt.
        </p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Nuvarande lösenord
          </span>
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
            className="divlab-input w-full px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Nytt lösenord
          </span>
          <input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            className="divlab-input w-full px-4 py-3"
          />
          <span className="mt-2 block text-xs leading-5 text-divlab-text-muted">
            Använd minst {MIN_PASSWORD_LENGTH} tecken.
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Bekräfta nytt lösenord
          </span>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            className="divlab-input w-full px-4 py-3"
          />
        </label>

        {state.status === "error" && state.message ? (
          <p
            role="alert"
            className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-3 text-sm leading-6 text-divlab-text-secondary"
          >
            {state.message}
          </p>
        ) : null}

        {state.status === "success" && state.message ? (
          <p
            role="status"
            className="rounded-xl border border-divlab-blue/20 bg-divlab-blue/5 px-4 py-3 text-sm leading-6 text-divlab-text-secondary"
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="divlab-btn-primary h-11 w-full px-6 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isPending ? "Sparar..." : "Uppdatera lösenord"}
          </button>
        </div>
      </form>
    </section>
  );
}
