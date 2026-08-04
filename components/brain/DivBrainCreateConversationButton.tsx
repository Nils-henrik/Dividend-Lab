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
      className="divlab-btn-ghost flex w-full min-h-10 items-center justify-between disabled:cursor-not-allowed disabled:opacity-60"
    >
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
