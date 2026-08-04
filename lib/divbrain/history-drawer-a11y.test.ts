/**
 * DivBrain history-drawer accessibility helper tests.
 * Uses lightweight DOM stubs — no React or jsdom dependency.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  focusDivBrainElementIfConnected,
  listDivBrainDialogFocusableElements,
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

describe("DivBrain history drawer source boundaries", () => {
  it("explicitly closes on conversation selection and wires focus refs", () => {
    const source = readFileSync(
      join(__dirname, "../../components/brain/DivBrainHistoryDrawer.tsx"),
      "utf8",
    );

    assert.equal(source.includes('"use client"'), true);
    assert.equal(source.includes("triggerButtonRef"), true);
    assert.equal(source.includes("closeButtonRef"), true);
    assert.equal(source.includes("dialogRef"), true);
    assert.equal(source.includes("closeDrawer"), true);
    assert.equal(source.includes("onClick={closeDrawer}"), true);
    assert.equal(source.includes('event.key === "Escape"'), true);
    assert.equal(source.includes("trapDivBrainDialogTabKey"), true);
    assert.equal(source.includes("focusDivBrainElementIfConnected"), true);
    assert.equal(source.includes("@/lib/divbrain/server"), false);
    assert.equal(source.includes("lib/divbrain/server"), false);
    assert.equal(source.includes("use server"), false);
    assert.equal(source.includes("submitMessage"), false);
    assert.equal(source.includes("createConversation"), false);
    assert.equal(source.includes("type=\"submit\""), false);

    // Backdrop is a non-tab-stop presentation surface, not a button.
    assert.equal(source.includes('aria-hidden="true"'), true);
    assert.equal(source.includes('className="absolute inset-0 bg-black/50"'), true);
    assert.equal(
      source.includes(
        'aria-label="Stäng historik"\n            className="absolute inset-0',
      ),
      false,
    );
  });
});
