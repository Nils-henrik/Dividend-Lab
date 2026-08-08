"use client";

import { useFormStatus } from "react-dom";
import { createDivBrainConversationAction } from "@/app/brain/actions";

type Props = {
  className?: string;
  label?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-divlab-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-divlab-blue disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="text-lg font-light leading-none" aria-hidden="true">
        +
      </span>
      <span>{pending ? "Skapar…" : label}</span>
    </button>
  );
}

export default function DivBrainCreateConversationButton({
  className,
  label = "Ny konversation",
}: Props) {
  return (
    <form action={createDivBrainConversationAction} className={className}>
      <SubmitButton label={label} />
    </form>
  );
}
