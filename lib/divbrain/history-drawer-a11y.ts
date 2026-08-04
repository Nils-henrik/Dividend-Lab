/**
 * Small focus helpers for the DivBrain mobile history drawer.
 * Browser-safe. No server imports.
 */

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
