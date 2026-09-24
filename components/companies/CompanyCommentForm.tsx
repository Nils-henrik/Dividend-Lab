"use client";

import { useActionState, useEffect, useRef } from "react";
import { publishCompanyCommentAction } from "@/app/bolag/actions";
import { COMPANY_COMMENT_MAX_LENGTH } from "@/lib/companies/comments";

const initialState = {
  status: "idle",
  message: "",
} as const;

type Props = {
  companySlug: string;
};

export default function CompanyCommentForm({ companySlug }: Props) {
  const [state, formAction, isPending] = useActionState(
    publishCompanyCommentAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="companySlug" value={companySlug} />
      <label className="block text-xs font-medium text-divlab-text-muted" htmlFor="company-comment-body">
        Skriv en kommentar
        <textarea
          id="company-comment-body"
          name="body"
          rows={4}
          maxLength={COMPANY_COMMENT_MAX_LENGTH}
          required
          placeholder="Skriv en kommentar..."
          className="divlab-input mt-1.5 w-full resize-none px-3 py-2 text-sm leading-6 placeholder:text-divlab-text-subtle"
        />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-divlab-text-muted">
          Max {COMPANY_COMMENT_MAX_LENGTH} tecken
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="divlab-btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Publicerar..." : "Publicera"}
        </button>
      </div>
      {state.status === "error" ? (
        <p role="alert" className="rounded-xl border divlab-border-neutral divlab-inset px-3 py-2 text-xs leading-5 text-divlab-text-secondary">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
