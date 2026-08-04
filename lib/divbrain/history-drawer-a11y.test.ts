/**
 * DivBrain history-drawer accessibility and responsive helper tests.
 * Uses lightweight stubs — no React or jsdom dependency.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DIVBRAIN_HISTORY_DRAWER_DESKTOP_MEDIA_QUERY,
  DIVBRAIN_HISTORY_DRAWER_DESKTOP_MIN_WIDTH_PX,
  focusDivBrainElementIfConnected,
  isDivBrainElementVisiblyFocusable,
  listDivBrainDialogFocusableElements,
  shouldRestoreDivBrainHistoryDrawerTriggerFocus,
  subscribeDivBrainDesktopMediaChange,
  trapDivBrainDialogTabKey,
} from "./history-drawer-a11y";

const __dirname = dirname(fileURLToPath(import.meta.url));

type FakeElement = HTMLElement & {
  _focused?: boolean;
};

function createFakeElement(options: {
  disabled?: boolean;
  ariaDisabled?: boolean;
  ariaHiddenAncestor?: boolean;
  text: string;
  connected?: boolean;
  clientRectCount?: number;
}): FakeElement {
  const element = {
    textContent: options.text,
    isConnected: options.connected ?? true,
    _focused: false,
    hasAttribute(name: string) {
      return name === "disabled" && Boolean(options.disabled);
    },
    getAttribute(name: string) {
      if (name === "aria-disabled" && options.ariaDisabled) {
        return "true";
      }
      return null;
    },
    closest(selector: string) {
      if (
        selector === '[aria-hidden="true"]' &&
        options.ariaHiddenAncestor
      ) {
        return {} as Element;
      }
      return null;
    },
    getClientRects() {
      const count = options.clientRectCount ?? 1;
      return {
        length: count,
      } as DOMRectList;
    },
    focus() {
      this._focused = true;
    },
  };

  return element as unknown as FakeElement;
}

describe("DivBrain history drawer a11y helpers", () => {
  it("lists focusable elements and excludes disabled controls", () => {
    const closeBtn = createFakeElement({ text: "Close" });
    const disabledBtn = createFakeElement({ text: "Disabled", disabled: true });
    const link = createFakeElement({ text: "Link" });
    const ariaDisabled = createFakeElement({
      text: "Aria disabled",
      ariaDisabled: true,
    });

    const container = {
      querySelectorAll() {
        return [closeBtn, disabledBtn, link, ariaDisabled];
      },
    } as unknown as ParentNode;

    const focusables = listDivBrainDialogFocusableElements(container);
    assert.equal(focusables.length, 2);
    assert.equal(focusables[0]?.textContent, "Close");
    assert.equal(focusables[1]?.textContent, "Link");
  });

  it("traps Tab from last to first and Shift+Tab from first to last", () => {
    const first = createFakeElement({ text: "Close" });
    const last = createFakeElement({ text: "Link" });
    const container = {
      querySelectorAll() {
        return [first, last];
      },
      contains(node: Node | null) {
        return node === first || node === last;
      },
    } as unknown as ParentNode;

    let prevented = false;
    assert.equal(
      trapDivBrainDialogTabKey(
        {
          key: "Tab",
          shiftKey: false,
          preventDefault() {
            prevented = true;
          },
        },
        container,
        last,
      ),
      true,
    );
    assert.equal(prevented, true);
    assert.equal((first as FakeElement)._focused, true);

    prevented = false;
    (last as FakeElement)._focused = false;
    assert.equal(
      trapDivBrainDialogTabKey(
        {
          key: "Tab",
          shiftKey: true,
          preventDefault() {
            prevented = true;
          },
        },
        container,
        first,
      ),
      true,
    );
    assert.equal(prevented, true);
    assert.equal((last as FakeElement)._focused, true);
  });

  it("focuses only connected elements", () => {
    const connected = createFakeElement({ text: "B", connected: true });
    const disconnected = createFakeElement({ text: "C", connected: false });

    assert.equal(focusDivBrainElementIfConnected(connected), true);
    assert.equal((connected as FakeElement)._focused, true);
    assert.equal(focusDivBrainElementIfConnected(null), false);
    assert.equal(focusDivBrainElementIfConnected(disconnected), false);
  });
});

describe("DivBrain history drawer responsive helpers", () => {
  it("uses a single named desktop media query matching Tailwind lg", () => {
    assert.equal(DIVBRAIN_HISTORY_DRAWER_DESKTOP_MIN_WIDTH_PX, 1024);
    assert.equal(
      DIVBRAIN_HISTORY_DRAWER_DESKTOP_MEDIA_QUERY,
      "(min-width: 1024px)",
    );
  });

  it("treats zero client rects as not visibly focusable even when connected", () => {
    const hidden = createFakeElement({
      text: "Historik",
      connected: true,
      clientRectCount: 0,
    });
    const visible = createFakeElement({
      text: "Historik",
      connected: true,
      clientRectCount: 1,
    });

    assert.equal(isDivBrainElementVisiblyFocusable(hidden), false);
    assert.equal(isDivBrainElementVisiblyFocusable(visible), true);
  });

  it("suppresses focus restoration for desktop and navigate close reasons", () => {
    const visible = createFakeElement({
      text: "Historik",
      connected: true,
      clientRectCount: 1,
    });
    const hidden = createFakeElement({
      text: "Historik",
      connected: true,
      clientRectCount: 0,
    });

    assert.equal(
      shouldRestoreDivBrainHistoryDrawerTriggerFocus("desktop", visible),
      false,
    );
    assert.equal(
      shouldRestoreDivBrainHistoryDrawerTriggerFocus("navigate", visible),
      false,
    );
    assert.equal(
      shouldRestoreDivBrainHistoryDrawerTriggerFocus("user", visible),
      true,
    );
    assert.equal(
      shouldRestoreDivBrainHistoryDrawerTriggerFocus("user", hidden),
      false,
    );
  });

  it("subscribes to media changes and unsubscribes on cleanup", () => {
    const listeners: Array<(event: { matches: boolean }) => void> = [];
    const mediaQuery = {
      matches: false,
      addEventListener(
        _type: "change",
        listener: (event: { matches: boolean }) => void,
      ) {
        listeners.push(listener);
      },
      removeEventListener(
        _type: "change",
        listener: (event: { matches: boolean }) => void,
      ) {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      },
    };

    let desktopCloseCount = 0;
    const unsubscribe = subscribeDivBrainDesktopMediaChange(mediaQuery, () => {
      desktopCloseCount += 1;
    });

    assert.equal(listeners.length, 1);
    listeners[0]?.({ matches: false });
    assert.equal(desktopCloseCount, 0);
    listeners[0]?.({ matches: true });
    assert.equal(desktopCloseCount, 1);

    unsubscribe();
    assert.equal(listeners.length, 0);
    // Further events cannot fire after unsubscribe.
    assert.equal(desktopCloseCount, 1);
  });

  it("supports legacy addListener/removeListener media queries", () => {
    const listeners: Array<(event: { matches: boolean }) => void> = [];
    const mediaQuery = {
      matches: false,
      addListener(listener: (event: { matches: boolean }) => void) {
        listeners.push(listener);
      },
      removeListener(listener: (event: { matches: boolean }) => void) {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      },
    };

    let closed = false;
    const unsubscribe = subscribeDivBrainDesktopMediaChange(mediaQuery, () => {
      closed = true;
    });

    listeners[0]?.({ matches: true });
    assert.equal(closed, true);
    unsubscribe();
    assert.equal(listeners.length, 0);
  });
});

describe("DivBrain history drawer source boundaries", () => {
  it("wires desktop close, focus reasons, and existing dismissal paths", () => {
    const source = readFileSync(
      join(__dirname, "../../components/brain/DivBrainHistoryDrawer.tsx"),
      "utf8",
    );

    assert.equal(source.includes('"use client"'), true);
    assert.equal(source.includes("triggerButtonRef"), true);
    assert.equal(source.includes("closeButtonRef"), true);
    assert.equal(source.includes("dialogRef"), true);
    assert.equal(source.includes("closeDrawer"), true);
    assert.equal(source.includes('closeDrawer("user")'), true);
    assert.equal(source.includes('closeDrawer("desktop")'), true);
    assert.equal(source.includes('closeDrawer("navigate")'), true);
    assert.equal(source.includes("DIVBRAIN_HISTORY_DRAWER_DESKTOP_MEDIA_QUERY"), true);
    assert.equal(source.includes("subscribeDivBrainDesktopMediaChange"), true);
    assert.equal(
      source.includes("shouldRestoreDivBrainHistoryDrawerTriggerFocus"),
      true,
    );
    assert.equal(source.includes('event.key === "Escape"'), true);
    assert.equal(source.includes("trapDivBrainDialogTabKey"), true);
    assert.equal(source.includes("document.body.style.overflow"), true);
    assert.equal(source.includes("@/lib/divbrain/server"), false);
    assert.equal(source.includes("lib/divbrain/server"), false);
    assert.equal(source.includes("use server"), false);
    assert.equal(source.includes("submitMessage"), false);
    assert.equal(source.includes("DivBrainCreateConversationButton"), true);
    assert.equal(source.includes("DivBrainScopeSwitch"), true);

    // Backdrop is a non-tab-stop presentation surface, not a button.
    assert.equal(source.includes('aria-hidden="true"'), true);
    assert.equal(source.includes('className="absolute inset-0 bg-black/50"'), true);
  });
});
