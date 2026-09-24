"use client";

import { useActionState } from "react";
import { deleteCompanyCommentAction } from "@/app/bolag/actions";

const initialState = {
  status: "idle",
  message: "",
} as const;

type Props = {
  companySlug: string;
  commentId: string;
};

export default function DeleteCompanyCommentButton({ companySlug, commentId }: Props) {
  const [state, formAction, isPending] = useActionState(
    deleteCompanyCommentAction,
    initialState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="companySlug" value={companySlug} />
      <input type="hidden" name="commentId" value={commentId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-divlab-text-muted transition hover:text-divlab-text disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Tar bort..." : "Ta bort"}
      </button>
      {state.status === "error" ? (
        <span role="alert" className="ml-2 text-xs text-divlab-text-secondary">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
