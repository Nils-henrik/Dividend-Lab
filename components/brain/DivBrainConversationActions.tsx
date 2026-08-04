"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  archiveDivBrainConversationAction,
  deleteDivBrainConversationAction,
  renameDivBrainConversationAction,
  restoreDivBrainConversationAction,
} from "@/app/brain/actions";
import {
  DIVBRAIN_ACTION_STATE_IDLE,
  type DivBrainActionState,
} from "@/lib/divbrain/action-state";
import type { DivBrainArchiveScope } from "@/lib/divbrain/brain-routes";
import { DIVBRAIN_TITLE_MAX_LENGTH } from "@/lib/divbrain/constants";
import {
  focusDivBrainElementIfConnected,
  trapDivBrainDialogTabKey,
} from "@/lib/divbrain/history-drawer-a11y";

type Props = {
  conversationId: string;
  title: string;
  archived: boolean;
  archiveScope: DivBrainArchiveScope;
};

type DialogMode = "none" | "menu" | "rename" | "delete";

export default function DivBrainConversationActions({
  conversationId,
  title,
  archived,
  archiveScope,
}: Props) {
  const [mode, setMode] = useState<DialogMode>("none");
  const [renameTitle, setRenameTitle] = useState(title);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const renameTitleId = useId();
  const deleteTitleId = useId();
  const deleteDescId = useId();
  const renameStatusId = useId();

  const [renameState, renameAction, renamePending] = useActionState<
    DivBrainActionState,
    FormData
  >(renameDivBrainConversationAction, DIVBRAIN_ACTION_STATE_IDLE);

  useEffect(() => {
    if (mode === "none") {
      return;
    }

    if (mode === "rename") {
      focusDivBrainElementIfConnected(renameInputRef.current);
    } else if (mode === "delete") {
      focusDivBrainElementIfConnected(cancelDeleteRef.current);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (mode === "rename" || mode === "delete") {
        trapDivBrainDialogTabKey(
          event,
          dialogRef.current,
          document.activeElement,
        );
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mode]);

  function closeDialog() {
    setMode("none");
    focusDivBrainElementIfConnected(menuButtonRef.current);
  }

  function openRename() {
    setRenameTitle(title);
    setMode("rename");
  }

  function openDelete() {
    setMode("delete");
  }

  return (
    <div className="relative">
      <button
        ref={menuButtonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={mode === "menu"}
        onClick={() => setMode((current) => (current === "menu" ? "none" : "menu"))}
        className="divlab-btn-ghost min-h-10 px-3 text-sm"
      >
        Hantera
      </button>

      {mode === "menu" ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-52 rounded-xl border divlab-border-neutral bg-divlab-surface p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full min-h-10 items-center rounded-lg px-3 text-left text-sm text-divlab-text hover:bg-divlab-elevated"
            onClick={openRename}
          >
            Byt namn
          </button>
          {archived ? (
            <form action={restoreDivBrainConversationAction}>
              <input type="hidden" name="conversationId" value={conversationId} />
              <button
                type="submit"
                role="menuitem"
                className="flex w-full min-h-10 items-center rounded-lg px-3 text-left text-sm text-divlab-text hover:bg-divlab-elevated"
              >
                Återställ
              </button>
            </form>
          ) : (
            <form action={archiveDivBrainConversationAction}>
              <input type="hidden" name="conversationId" value={conversationId} />
              <button
                type="submit"
                role="menuitem"
                className="flex w-full min-h-10 items-center rounded-lg px-3 text-left text-sm text-divlab-text hover:bg-divlab-elevated"
              >
                Arkivera
              </button>
            </form>
          )}
          <button
            type="button"
            role="menuitem"
            className="flex w-full min-h-10 items-center rounded-lg px-3 text-left text-sm text-red-700 hover:bg-divlab-elevated"
            onClick={openDelete}
          >
            Ta bort permanent
          </button>
        </div>
      ) : null}

      {mode === "rename" ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={renameTitleId}
            className="divlab-card w-full max-w-md p-5"
          >
            <h3
              id={renameTitleId}
              className="text-lg font-semibold tracking-[-0.03em] text-divlab-text"
            >
              Byt namn på konversation
            </h3>
            <form action={renameAction} className="mt-4 space-y-4">
              <input type="hidden" name="conversationId" value={conversationId} />
              <label htmlFor={`${renameTitleId}-input`} className="sr-only">
                Nytt namn
              </label>
              <input
                ref={renameInputRef}
                id={`${renameTitleId}-input`}
                name="title"
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                maxLength={DIVBRAIN_TITLE_MAX_LENGTH}
                required
                disabled={renamePending}
                className="divlab-input w-full"
              />
              <p
                id={renameStatusId}
                role="status"
                aria-live="polite"
                className="min-h-5 text-xs text-divlab-text-secondary"
              >
                {renameState.status === "error" ? renameState.safeMessage : null}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="divlab-btn-ghost min-h-10 px-4"
                  onClick={closeDialog}
                  disabled={renamePending}
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="divlab-btn-primary min-h-10 px-4"
                  disabled={renamePending || renameTitle.trim().length === 0}
                >
                  {renamePending ? "Sparar…" : "Spara"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {mode === "delete" ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteTitleId}
            aria-describedby={deleteDescId}
            className="divlab-card w-full max-w-md p-5"
          >
            <h3
              id={deleteTitleId}
              className="text-lg font-semibold tracking-[-0.03em] text-divlab-text"
            >
              Ta bort konversationen permanent?
            </h3>
            <p
              id={deleteDescId}
              className="mt-3 text-sm leading-6 text-divlab-text-secondary"
            >
              Konversationen raderas permanent tillsammans med alla DivBrain-
              meddelanden i den. Det går inte att ångra.
            </p>
            <form
              action={deleteDivBrainConversationAction}
              className="mt-5 flex flex-wrap justify-end gap-2"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                // Deletion only proceeds when this confirmed form is submitted.
                void event;
              }}
            >
              <input type="hidden" name="conversationId" value={conversationId} />
              <input type="hidden" name="confirmDelete" value="permanent" />
              <input type="hidden" name="archiveScope" value={archiveScope} />
              <button
                ref={cancelDeleteRef}
                type="button"
                className="divlab-btn-ghost min-h-10 px-4"
                onClick={closeDialog}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="min-h-10 rounded-xl bg-red-700 px-4 text-sm font-medium text-white transition hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Ta bort permanent
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
