import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("global chat shell wiring", () => {
  it("mounts chat only for signed-in AppShell sessions", () => {
    const shell = read("components/layout/AppShellClient.tsx");
    assert.match(shell, /if \(isGuest \|\| !chatBootstrap\?\.currentUserId\)/);
    assert.match(shell, /<ChatProvider bootstrap=\{chatBootstrap\}>/);
    assert.doesNotMatch(shell, /isGuest\s*=\s*true[\s\S]*ChatProvider/);
  });

  it("adds desktop and mobile launchers with live unread", () => {
    const header = read("components/layout/AppHeader.tsx");
    const mobile = read("components/layout/MobileAppHeader.tsx");
    assert.match(header, /ChatLauncherButton/);
    assert.match(mobile, /ChatLauncherButton/);
    assert.match(header, /chat\?\.unreadCount/);
    assert.match(mobile, /chat\?\.unreadCount/);
  });

  it("keeps \/messages as a full inbox fallback", () => {
    const inbox = read("app/messages/page.tsx");
    const thread = read("app/messages/[conversationId]/page.tsx");
    assert.match(inbox, /MessagesInbox/);
    assert.match(thread, /ConversationThreadView/);
    assert.match(read("app/messages/actions.ts"), /redirect\(`\/messages\/\$\{conversationId\}`\)/);
  });

  it("does not clear unread state just because a restored thread is loaded", () => {
    const actions = read("app/messages/actions.ts");
    const provider = read("components/messages/chat/ChatProvider.tsx");
    assert.match(
      actions,
      /loadChatThreadAction[\s\S]*loadConversationThreadMutation\(conversationId, \{ markRead: false \}\)/,
    );
    assert.match(provider, /markLocalRead\(conversationId\)/);
    assert.match(provider, /markChatConversationReadAction\(conversationId\)/);
  });

  it("exposes the active-status setting in Swedish", () => {
    const settings = read("components/settings/ActiveStatusSetting.tsx");
    assert.match(settings, /Visa när jag är aktiv/);
    assert.match(settings, /setShareActiveStatusAction/);
  });

  it("does not persist transcript contents in the window storage helper", () => {
    const state = read("lib/messages/chat-state.ts");
    assert.match(state, /CHAT_WINDOW_STORAGE_KEY/);
    assert.match(state, /conversationId/);
    assert.doesNotMatch(state, /sessionStorage\.setItem\([^\)]*body/);
  });
});
