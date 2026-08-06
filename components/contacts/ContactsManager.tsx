"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  acceptContactRequestAction,
  cancelContactRequestAction,
  declineContactRequestAction,
  removeContactAction,
} from "@/app/contacts/actions";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import type {
  ContactActionState,
  ContactListItem,
  ContactRequestItem,
} from "@/lib/contacts/types";

const idleState: ContactActionState = {
  status: "idle",
  message: "",
};

type Tab = "accepted" | "incoming" | "outgoing";

type Props = {
  accepted: ContactListItem[];
  incoming: ContactRequestItem[];
  outgoing: ContactRequestItem[];
  errorMessage?: string;
  initialTab?: Tab;
  highlightedRequestId?: string | null;
};

function isContactTab(value: string | undefined): value is Tab {
  return value === "accepted" || value === "incoming" || value === "outgoing";
}

function Feedback({ state }: { state: ContactActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className={`mt-2 text-xs ${
        state.status === "error" ? "text-red-300" : "text-divlab-text-secondary"
      }`}
    >
      {state.message}
    </p>
  );
}

function ContactIdentity({
  name,
  username,
  avatarUrl,
  initials,
}: {
  name: string;
  username: string | null;
  avatarUrl: string | null;
  initials: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProfileAvatar
        avatarUrl={avatarUrl}
        initials={initials}
        sizeClassName="h-11 w-11"
        textClassName="text-sm"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-divlab-text">{name}</p>
        {username ? (
          <p className="mt-0.5 truncate text-xs text-divlab-text-muted">@{username}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function ContactsManager({
  accepted,
  incoming,
  outgoing,
  errorMessage,
  initialTab = "accepted",
  highlightedRequestId = null,
}: Props) {
  const [tab, setTab] = useState<Tab>(
    isContactTab(initialTab) ? initialTab : "accepted",
  );
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptContactRequestAction,
    idleState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineContactRequestAction,
    idleState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelContactRequestAction,
    idleState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeContactAction,
    idleState,
  );
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightedRequestId || tab !== "incoming") {
      return;
    }

    const target = document.getElementById(
      `contact-request-${highlightedRequestId}`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedRequestId, tab]);

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: "accepted", label: "Kontakter", count: accepted.length },
    { id: "incoming", label: "Inkommande förfrågningar", count: incoming.length },
    { id: "outgoing", label: "Skickade förfrågningar", count: outgoing.length },
  ];

  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <div>
          <p className="mb-3 divlab-section-label">Nätverk</p>
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
            Kontakter
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-divlab-text-secondary">
            Hantera dina kontakter och förfrågningar. Privata chattar är
            separata från kontaktrelationen.
          </p>
        </div>
      </section>

      {errorMessage ? (
        <section className="divlab-card p-8">
          <p className="text-lg font-semibold text-divlab-text">
            Kontakter kunde inte laddas
          </p>
          <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
            {errorMessage}
          </p>
        </section>
      ) : (
        <>
          <div
            className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0"
            aria-label="Kontaktvyer"
          >
            <div className="flex w-max gap-2 pb-0.5" role="tablist">
              {tabs.map((option) => {
                const isActive = tab === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setTab(option.id)}
                    className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${
                      isActive
                        ? "divlab-selected"
                        : "border-transparent bg-divlab-surface text-divlab-text-muted hover:text-divlab-text-secondary"
                    }`}
                  >
                    {option.label}
                    <span className="ml-2 text-divlab-text-muted">{option.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {tab === "accepted" && (
            <section className="divlab-card overflow-hidden p-0">
              {accepted.length === 0 ? (
                <p className="px-5 py-8 text-sm leading-6 text-divlab-text-secondary">
                  Du har inga kontakter ännu.
                </p>
              ) : (
                <ul className="divide-y divide-white/[0.08]">
                  {accepted.map((item) => {
                    const profileHref = item.profile.username
                      ? `/profile/${item.profile.username}`
                      : null;
                    const messageHref = item.profile.username
                      ? `/messages/new?username=${encodeURIComponent(item.profile.username)}`
                      : `/messages/new?userId=${encodeURIComponent(item.profile.id)}`;

                    return (
                      <li
                        key={item.connectionId}
                        className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {profileHref ? (
                          <Link href={profileHref} className="min-w-0">
                            <ContactIdentity
                              name={item.profile.name}
                              username={item.profile.username}
                              avatarUrl={item.profile.avatarUrl}
                              initials={item.profile.initials}
                            />
                          </Link>
                        ) : (
                          <ContactIdentity
                            name={item.profile.name}
                            username={item.profile.username}
                            avatarUrl={item.profile.avatarUrl}
                            initials={item.profile.initials}
                          />
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Link
                            href={messageHref}
                            className="divlab-btn-primary px-4 py-2 text-xs"
                          >
                            Skicka meddelande
                          </Link>
                          {confirmRemoveId === item.connectionId ? (
                            <form action={removeAction}>
                              <input
                                type="hidden"
                                name="connectionId"
                                value={item.connectionId}
                              />
                              <button
                                type="submit"
                                disabled={removePending}
                                className="divlab-btn-secondary px-4 py-2 text-xs disabled:opacity-60"
                              >
                                {removePending ? "Tar bort..." : "Bekräfta borttagning"}
                              </button>
                              <Feedback state={removeState} />
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(item.connectionId)}
                              className="divlab-btn-ghost px-4 py-2 text-xs"
                            >
                              Ta bort kontakt
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {tab === "incoming" && (
            <section className="divlab-card overflow-hidden p-0">
              {incoming.length === 0 ? (
                <p className="px-5 py-8 text-sm leading-6 text-divlab-text-secondary">
                  Du har inga inkommande kontaktförfrågningar.
                </p>
              ) : (
                <ul className="divide-y divide-white/[0.08]">
                  {incoming.map((item) => {
                    const profileHref = item.profile.username
                      ? `/profile/${item.profile.username}`
                      : null;
                    const isHighlighted =
                      highlightedRequestId === item.connectionId;

                    return (
                      <li
                        id={`contact-request-${item.connectionId}`}
                        key={item.connectionId}
                        className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                          isHighlighted ? "bg-divlab-blue/[0.05]" : ""
                        }`}
                      >
                        {profileHref ? (
                          <Link href={profileHref} className="min-w-0">
                            <ContactIdentity
                              name={item.profile.name}
                              username={item.profile.username}
                              avatarUrl={item.profile.avatarUrl}
                              initials={item.profile.initials}
                            />
                          </Link>
                        ) : (
                          <ContactIdentity
                            name={item.profile.name}
                            username={item.profile.username}
                            avatarUrl={item.profile.avatarUrl}
                            initials={item.profile.initials}
                          />
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <form action={acceptAction}>
                            <input
                              type="hidden"
                              name="connectionId"
                              value={item.connectionId}
                            />
                            <button
                              type="submit"
                              disabled={acceptPending}
                              className="divlab-btn-primary px-4 py-2 text-xs disabled:opacity-60"
                            >
                              {acceptPending ? "Accepterar..." : "Acceptera"}
                            </button>
                            <Feedback state={acceptState} />
                          </form>
                          <form action={declineAction}>
                            <input
                              type="hidden"
                              name="connectionId"
                              value={item.connectionId}
                            />
                            <button
                              type="submit"
                              disabled={declinePending}
                              className="divlab-btn-secondary px-4 py-2 text-xs disabled:opacity-60"
                            >
                              {declinePending ? "Nekar..." : "Neka"}
                            </button>
                            <Feedback state={declineState} />
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {tab === "outgoing" && (
            <section className="divlab-card overflow-hidden p-0">
              {outgoing.length === 0 ? (
                <p className="px-5 py-8 text-sm leading-6 text-divlab-text-secondary">
                  Du har inga skickade kontaktförfrågningar.
                </p>
              ) : (
                <ul className="divide-y divide-white/[0.08]">
                  {outgoing.map((item) => {
                    const profileHref = item.profile.username
                      ? `/profile/${item.profile.username}`
                      : null;

                    return (
                      <li
                        key={item.connectionId}
                        className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {profileHref ? (
                          <Link href={profileHref} className="min-w-0">
                            <ContactIdentity
                              name={item.profile.name}
                              username={item.profile.username}
                              avatarUrl={item.profile.avatarUrl}
                              initials={item.profile.initials}
                            />
                          </Link>
                        ) : (
                          <ContactIdentity
                            name={item.profile.name}
                            username={item.profile.username}
                            avatarUrl={item.profile.avatarUrl}
                            initials={item.profile.initials}
                          />
                        )}
                        <form action={cancelAction}>
                          <input
                            type="hidden"
                            name="connectionId"
                            value={item.connectionId}
                          />
                          <button
                            type="submit"
                            disabled={cancelPending}
                            className="divlab-btn-ghost px-4 py-2 text-xs disabled:opacity-60"
                          >
                            {cancelPending ? "Avbryter..." : "Avbryt förfrågan"}
                          </button>
                          <Feedback state={cancelState} />
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
