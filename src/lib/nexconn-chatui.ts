"use client";

// Nexconn Chat UI (Web Components) for private 1:1 crew conversations only. The crew group chat, incident cards and
// huddles keep using the Chat SDK directly (see nexconn-client.ts). API names verified against
// @nexconn/chatui@26.2.5 dist/index.d.ts. Init order follows the Chat UI quickstart: NCEngine.initialize →
// NCChatUIApplication.initialize → ready() → NCEngine.connect, so Chat UI shares the page's single Nexconn session.
import type { LogLevel } from "@nexconn/chat";
import type { NCChatUIApplication, ServiceHooks } from "@nexconn/chatui";

type ChatUi = typeof import("@nexconn/chatui");

const state = {
  app: null as NCChatUIApplication | null,
  mod: null as ChatUi | null,
  names: new Map<string, string>(),
  sendListeners: new Set<(peerUserId: string) => void>(),
};

/** Display names for Nexconn user ids (crew roster). Chat UI asks for them through ServiceHooks and caches them. */
export function rememberProfiles(people: { nexconnUserId: string; name: string }[]) {
  for (const p of people) {
    if (!p.nexconnUserId || !p.name) continue;
    const before = state.names.get(p.nexconnUserId);
    state.names.set(p.nexconnUserId, p.name);
    if (before !== p.name && state.app?.ifReady()) state.app.updateUserProfile({ userId: p.nexconnUserId, name: p.name });
  }
}

const nameOf = (userId: string) => state.names.get(userId) ?? "Crew member";

const hooks: ServiceHooks = {
  async reqUserProfiles(userIds) {
    return userIds.map((userId) => ({ userId, name: nameOf(userId) }));
  },
  // Chat UI is only opened on direct channels; group/system lookups get neutral placeholders.
  async reqGroupProfiles(groupIds) {
    return groupIds.map((groupId) => ({ groupId, name: "Crew", memberCount: 0 }));
  },
  async reqGroupMembers() {
    return [];
  },
  async reqSystemProfiles(systemIds) {
    return systemIds.map((systemId) => ({ systemId, name: "Baton" }));
  },
  getDefaultUserProfile(userId) {
    return { userId, name: nameOf(userId) };
  },
};

/**
 * Must run after NCEngine.initialize and before NCEngine.connect. Failure is non-fatal: the rest of Baton keeps
 * working and DirectThread shows that private messages are unavailable.
 */
export async function installChatUi(logLevel: LogLevel) {
  if (state.app) return;
  const mod = await import("@nexconn/chatui");
  const app = mod.NCChatUIApplication.initialize({ hooks, language: "en_US", logLevel });
  if (!app) throw new Error("ChatUI initialize failed");
  app.setCommandSwitch(mod.ChatUICommand.SHOW_MESSAGE_STATE, true);
  app.addEventListener(mod.ChatUIEvents.MESSAGE_WILL_SEND, (evt) => {
    const id = evt.data?.channelIdentifier;
    if (id) state.sendListeners.forEach((l) => l(id.channelId));
  });
  app.ready();
  // Baton's own sheet/pane header owns navigation, so Chat UI's mobile back button would be a dead control.
  app.setChannelDetailBackSwitch(false);
  state.mod = mod;
  state.app = app;
}

export function chatUiReady() {
  return Boolean(state.app?.ifReady());
}

/** Fires when the user sends a message from Chat UI (used to refresh Baton's inbox). */
export function onChatUiSend(fn: (peerUserId: string) => void) {
  state.sendListeners.add(fn);
  return () => {
    state.sendListeners.delete(fn);
  };
}

/**
 * The conversation pane only. Baton renders its own inbox, so instead of the root `nc-chat-ui-app-provider` shell
 * (whose channel list always shows above 768px) we mount the detail provider on its own, as the components guide
 * allows ("omit the root provider and embed the child providers, handling outer layout yourself").
 */
export const CHAT_UI_DETAIL_TAG = "nc-channel-detail-provider";

/** Opens the direct channel with `peerUserId` in the mounted Chat UI conversation pane. */
export async function openDirect(peerUserId: string) {
  const app = state.app;
  if (!app?.ifReady()) throw new Error("Chat UI is not ready");
  const { DirectChannelIdentifier } = await import("@nexconn/chat");
  let res = await app.openChannel(new DirectChannelIdentifier(peerUserId), true);
  // 39005 CHANNEL_LIST_NOT_READY: the initial channel list is still syncing right after connect.
  for (let attempt = 0; res.code === 39005 && attempt < 5; attempt++) {
    await new Promise((r) => setTimeout(r, 800));
    res = await app.openChannel(new DirectChannelIdentifier(peerUserId), true);
  }
  if (!res.isOk) throw new Error(`Could not open the conversation (code ${res.code})`);
}

/**
 * Pre-fills Chat UI's message input (e.g. "Re #12 Water at Gate 3: "). Chat UI keeps drafts in its own channel cache,
 * so the text is set on its textarea with a normal input event, exactly as if the user had typed it.
 */
export function prefillInput(root: Element, text: string) {
  const area = deepQuery(root, "textarea") as HTMLTextAreaElement | null;
  if (!area || area.value) return false;
  area.value = text;
  area.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  area.focus();
  area.setSelectionRange(text.length, text.length);
  return true;
}

function deepQuery(node: Element | ShadowRoot, selector: string): Element | null {
  const direct = node.querySelector(selector);
  if (direct) return direct;
  for (const el of node.querySelectorAll("*")) {
    if (el.shadowRoot) {
      const found = deepQuery(el.shadowRoot, selector);
      if (found) return found;
    }
  }
  return node instanceof Element && node.shadowRoot ? deepQuery(node.shadowRoot, selector) : null;
}

/**
 * Chat UI 26.2.5 gives its conversation a fixed 600px minimum width unless the *window* is phone-sized, which clips it
 * inside Baton's narrower panes (desktop incident sheet, 1024–1280px screens). Let it follow its container instead.
 */
export function fitToContainer(root: Element) {
  const shadow = root.shadowRoot;
  if (!shadow || typeof CSSStyleSheet === "undefined" || !("adoptedStyleSheets" in shadow)) return Boolean(shadow);
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(".nc-chatui-app-inner { min-width: 0 !important; }");
  shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
  return true;
}
