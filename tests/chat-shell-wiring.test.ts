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

  it("does not clear unread state just because a restored thread is preloaded", () => {
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

  it("toggles a desktop inbox panel on lg and xl instead of opening the first chat", () => {
    const provider = read("components/messages/chat/ChatProvider.tsx");
    const drawer = read("components/messages/chat/DesktopChatDrawer.tsx");
    const header = read("components/layout/AppHeader.tsx");
    const launcher = read("components/messages/chat/ChatLauncherButton.tsx");

    assert.match(provider, /resolveDesktopChatLauncherIntent\(isDesktop\)/);
    assert.match(provider, /setDesktopDrawerOpen\(\(open\) => !open\)/);
    assert.doesNotMatch(
      provider,
      /isWideDesktop[\s\S]{0,180}unreadChat/,
    );
    assert.match(drawer, /lg:block/);
    assert.doesNotMatch(drawer, /xl:hidden/);
    assert.match(header, /pressed=\{chat\.desktopDrawerOpen\}/);
    assert.match(launcher, /aria-pressed=\{pressed\}/);
    assert.match(launcher, /divlab-selected/);
  });

  it("renders minimized chats as circular avatar bubbles with restore labels", () => {
    const bubble = read("components/messages/chat/DesktopMinimizedChatBubble.tsx");
    const dock = read("components/messages/chat/DesktopChatDock.tsx");
    const windowSource = read("components/messages/chat/DesktopChatWindow.tsx");

    assert.match(bubble, /rounded-full/);
    assert.match(bubble, /Återställ chatt med/);
    assert.match(bubble, /oläst konversation/);
    assert.match(bubble, /aktiv nu/);
    assert.match(dock, /getDesktopChatDockLayout/);
    assert.match(dock, /DesktopMinimizedChatBubble/);
    assert.match(dock, /selectVisibleMinimizedWindows/);
    assert.doesNotMatch(windowSource, /max-w-\[9rem\] truncate/);
  });

  it("bounds visible minimized bubbles from the real minimized set instead of a hard-coded zero", () => {
    const provider = read("components/messages/chat/ChatProvider.tsx");
    const state = read("lib/messages/chat-state.ts");

    assert.match(provider, /planDesktopChatDock/);
    assert.match(provider, /visibleMinimizedCount/);
    assert.doesNotMatch(provider, /minimizedCount:\s*0/);
    assert.match(state, /getMaxVisibleMinimizedBubbles/);
    assert.match(state, /selectVisibleMinimizedWindows/);
    assert.doesNotMatch(state, /sessionStorage\.setItem\([^\)]*body/);
  });

  it("keeps the composer native with emoji insertion and a compact private attachment action", () => {
    const composer = read("components/messages/chat/ChatComposer.tsx");
    const picker = read("components/messages/chat/ChatEmojiPicker.tsx");
    const helper = read("lib/messages/chat-composer.ts");
    const transcript = read("components/messages/chat/ChatTranscript.tsx");

    assert.match(composer, /Öppna emoji/);
    assert.match(composer, /insertComposerText/);
    assert.match(composer, /aria-label="Skicka"/);
    assert.match(composer, /CHAT_ATTACHMENT_COPY_SV\.attachLabel/);
    assert.match(composer, /paperclip/);
    assert.match(read("lib/messages/attachments.ts"), /Bifoga fil/);
    assert.match(transcript, /ChatMessageAttachments/);
    assert.match(picker, /CHAT_COMPOSER_EMOJIS/);
    assert.match(picker, /role="dialog"/);
    assert.doesNotMatch(picker, /aria-modal/);
    assert.match(picker, /onClose\("escape"\)/);
    assert.match(picker, /onClose\("outside"\)/);
    assert.match(picker, /firstEmojiRef/);
    assert.match(composer, /shouldRestoreComposerFocusAfterEmojiPickerDismiss/);
    assert.match(composer, /data-chat-emoji-trigger/);
    assert.match(helper, /insertComposerText/);
    assert.doesNotMatch(composer, /video|telefon|giphy|tenor/i);
    assert.doesNotMatch(picker, /facebook|messenger|meta/i);
    assert.doesNotMatch(composer, /facebook|messenger|meta/i);
  });

  it("keeps ChatComposer IME-safe and does not regress the full-page composer", () => {
    const overlay = read("components/messages/chat/ChatComposer.tsx");
    const helper = read("lib/messages/chat-composer.ts");
    const fullPage = read("components/messages/MessageComposer.tsx");
    assert.match(overlay, /shouldSubmitChatComposerKey/);
    assert.match(overlay, /event\.nativeEvent\.isComposing/);
    assert.match(helper, /isComposing/);
    assert.match(helper, /keyCode !== 229/);
    assert.doesNotMatch(fullPage, /requestSubmit/);
    assert.doesNotMatch(fullPage, /onKeyDown/);
  });

  it("makes the mobile compose control focus search and list accepted contacts", () => {
    const experience = read("components/messages/chat/ChatExperience.tsx");
    const inbox = read("components/messages/chat/MobileChatInbox.tsx");
    const provider = read("components/messages/chat/ChatProvider.tsx");
    assert.match(experience, /onCompose=\{chat\.beginMobileCompose\}/);
    assert.match(inbox, /searchInputRef/);
    assert.match(inbox, /listMobileInboxResults/);
    assert.match(inbox, /composeMode/);
    assert.match(provider, /beginMobileCompose/);
    assert.match(provider, /applyPresenceRealtimePayload/);
  });
});
