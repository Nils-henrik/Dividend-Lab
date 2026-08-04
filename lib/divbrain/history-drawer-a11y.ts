/**
 * Small focus and responsive helpers for the DivBrain mobile history drawer.
 * Browser-safe. No server imports.
 */

/** Matches Tailwind `lg` used by the drawer overlay (`lg:hidden`). */
export const DIVBRAIN_HISTORY_DRAWER_DESKTOP_MIN_WIDTH_PX = 1024 as const;

export const DIVBRAIN_HISTORY_DRAWER_DESKTOP_MEDIA_QUERY =
  `(min-width: ${DIVBRAIN_HISTORY_DRAWER_DESKTOP_MIN_WIDTH_PX}px)` as const;

export type DivBrainHistoryDrawerCloseReason = "user" | "desktop" | "navigate";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Return keyboard-focusable elements within a container, excluding disabled
 * and aria-hidden nodes. Safe when container is null.
 */
export function listDivBrainDialogFocusableElements(
  container: ParentNode | null,
): HTMLElement[] {
  if (!container) {
    return [];
  }

  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );

  return nodes.filter((element) => {
    if (element.hasAttribute("disabled")) {
      return false;
    }
    if (element.getAttribute("aria-disabled") === "true") {
      return false;
    }
    if (element.closest('[aria-hidden="true"]')) {
      return false;
    }
    return true;
  });
}

/**
 * Keep Tab / Shift+Tab inside the dialog focusables.
 * Returns true when the event was handled.
 */
export function trapDivBrainDialogTabKey(
  event: Pick<KeyboardEvent, "key" | "shiftKey" | "preventDefault">,
  container: ParentNode | null,
  activeElement: Element | null,
): boolean {
  if (event.key !== "Tab") {
    return false;
  }

  const focusables = listDivBrainDialogFocusableElements(container);
  if (focusables.length === 0) {
    event.preventDefault();
    return true;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey) {
    if (activeElement === first || !container?.contains(activeElement)) {
      event.preventDefault();
      last.focus();
      return true;
    }
    return false;
  }

  if (activeElement === last) {
    event.preventDefault();
    first.focus();
    return true;
  }

  return false;
}

/**
 * Focus an element only when it is still connected to the document.
 */
export function focusDivBrainElementIfConnected(
  element: HTMLElement | null | undefined,
): boolean {
  if (!element || !element.isConnected) {
    return false;
  }

  element.focus();
  return true;
}

/**
 * True when the element is connected and has a non-empty layout box.
 * Elements hidden only by CSS (e.g. ancestor `lg:hidden`) remain connected
 * but typically have no client rects.
 */
export function isDivBrainElementVisiblyFocusable(
  element: HTMLElement | null | undefined,
): boolean {
  if (!element || !element.isConnected) {
    return false;
  }

  if (typeof element.getClientRects !== "function") {
    return true;
  }

  return element.getClientRects().length > 0;
}

/**
 * Decide whether closing the history drawer should restore focus to Historik.
 * Desktop breakpoint closure and navigation must not focus a hidden trigger.
 */
export function shouldRestoreDivBrainHistoryDrawerTriggerFocus(
  reason: DivBrainHistoryDrawerCloseReason,
  trigger: HTMLElement | null | undefined,
): boolean {
  if (reason === "desktop" || reason === "navigate") {
    return false;
  }

  return isDivBrainElementVisiblyFocusable(trigger);
}

/** Minimal MediaQueryList surface for deterministic tests and browsers. */
export type DivBrainMediaQueryListLike = {
  matches: boolean;
  addEventListener?: (
    type: "change",
    listener: (event: { matches: boolean }) => void,
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: (event: { matches: boolean }) => void,
  ) => void;
  /** Legacy Safari / older browsers. */
  addListener?: (listener: (event: { matches: boolean }) => void) => void;
  removeListener?: (listener: (event: { matches: boolean }) => void) => void;
};

/**
 * Subscribe to desktop-breakpoint matches. Invokes `onDesktop` when the
 * query becomes matching. Returns an unsubscribe function.
 */
export function subscribeDivBrainDesktopMediaChange(
  mediaQuery: DivBrainMediaQueryListLike,
  onDesktop: () => void,
): () => void {
  function handleChange(event: { matches: boolean }) {
    if (event.matches) {
      onDesktop();
    }
  }

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }

  if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handleChange);
    return () => {
      mediaQuery.removeListener?.(handleChange);
    };
  }

  return () => {};
}
