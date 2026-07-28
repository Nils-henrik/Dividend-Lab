"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  acceptContactRequestAction,
  cancelContactRequestAction,
  declineContactRequestAction,
  removeContactAction,
  sendContactRequestAction,
} from "@/app/contacts/actions";
import type { ContactActionState, ProfileContactState } from "@/lib/contacts/types";
import { formatContactCountLabel } from "@/lib/contacts/labels";

const idleState: ContactActionState = {
  status: "idle",
  message: "",
};

type Props = {
  profileUserId: string;
  profileUsername: string | null;
  contactCount: number;
  contactState: ProfileContactState;
  isAuthenticated: boolean;
  messageHref: string;
};

function Feedback({ state }: { state: ContactActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-xs leading-5 ${
        state.status === "error" ? "text-red-300" : "text-divlab-text-secondary"
      }`}
    >
      {state.message}
    </p>
  );
}

function ActionForm({
  action,
  children,
  hiddenFields,
  onSuccess,
}: {
  action: (
    state: ContactActionState,
    formData: FormData,
  ) => Promise<ContactActionState>;
  children: (isPending: boolean) => React.ReactNode;
  hiddenFields?: Record<string, string>;
  onSuccess?: (state: ContactActionState) => void;
}) {
  const [state, formAction, isPending] = useActionState(action, idleState);
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.status === "success" && state.message !== handledRef.current) {
      handledRef.current = state.message;
      onSuccess?.(state);
    }
  }, [onSuccess, state]);

  return (
    <form action={formAction} className="contents">
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children(isPending)}
      <Feedback state={state} />
    </form>
  );
}

export default function ProfileContactActions({
  profileUserId,
  profileUsername,
  contactCount,
  contactState,
  isAuthenticated,
  messageHref,
}: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const loginHref = `/login?redirect=${encodeURIComponent(
    profileUsername ? `/profile/${profileUsername}` : "/contacts",
  )}`;
  const countLabel = formatContactCountLabel(contactCount);

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto lg:items-end">
      <p className="text-sm text-divlab-text-secondary" aria-label={countLabel}>
        {contactState.kind === "self" ? (
          <Link href="/contacts" className="hover:text-divlab-text">
            {countLabel}
          </Link>
        ) : (
          countLabel
        )}
      </p>

      {contactState.kind === "self" ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/contacts" className="divlab-btn-secondary w-full sm:w-auto">
            Kontakter
          </Link>
          <Link href="/account/edit" className="divlab-btn-primary w-full sm:w-auto">
            Redigera profil
          </Link>
        </div>
      ) : !isAuthenticated || contactState.kind === "signed_out" ? (
        <Link href={loginHref} className="divlab-btn-primary w-full sm:w-auto">
          Logga in för att kontakta
        </Link>
      ) : (
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {contactState.kind === "none" && (
              <ActionForm
                action={sendContactRequestAction}
                hiddenFields={{ targetUserId: profileUserId }}
              >
                {(isPending) => (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="divlab-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isPending ? "Skickar..." : "Lägg till kontakt"}
                  </button>
                )}
              </ActionForm>
            )}

            {contactState.kind === "outgoing_pending" && (
              <>
                <span className="divlab-btn-ghost pointer-events-none w-full justify-center sm:w-auto">
                  Kontaktförfrågan skickad
                </span>
                <ActionForm
                  action={cancelContactRequestAction}
                  hiddenFields={{ connectionId: contactState.connectionId }}
                >
                  {(isPending) => (
                    <button
                      type="submit"
                      disabled={isPending}
                      className="divlab-btn-ghost w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isPending ? "Avbryter..." : "Avbryt förfrågan"}
                    </button>
                  )}
                </ActionForm>
              </>
            )}

            {contactState.kind === "incoming_pending" && (
              <>
                <ActionForm
                  action={acceptContactRequestAction}
                  hiddenFields={{ connectionId: contactState.connectionId }}
                >
                  {(isPending) => (
                    <button
                      type="submit"
                      disabled={isPending}
                      className="divlab-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isPending ? "Accepterar..." : "Acceptera"}
                    </button>
                  )}
                </ActionForm>
                <ActionForm
                  action={declineContactRequestAction}
                  hiddenFields={{ connectionId: contactState.connectionId }}
                >
                  {(isPending) => (
                    <button
                      type="submit"
                      disabled={isPending}
                      className="divlab-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isPending ? "Nekar..." : "Neka"}
                    </button>
                  )}
                </ActionForm>
              </>
            )}

            {contactState.kind === "accepted" && (
              <>
                {!confirmRemove ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    className="divlab-btn-ghost w-full sm:w-auto"
                  >
                    Ta bort kontakt
                  </button>
                ) : (
                  <ActionForm
                    action={removeContactAction}
                    hiddenFields={{ connectionId: contactState.connectionId }}
                    onSuccess={() => setConfirmRemove(false)}
                  >
                    {(isPending) => (
                      <button
                        type="submit"
                        disabled={isPending}
                        className="divlab-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {isPending ? "Tar bort..." : "Bekräfta borttagning"}
                      </button>
                    )}
                  </ActionForm>
                )}
              </>
            )}

            <Link href={messageHref} className="divlab-btn-primary w-full sm:w-auto">
              Skicka meddelande
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
