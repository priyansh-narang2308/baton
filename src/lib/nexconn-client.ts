"use client";

// Browser-side Nexconn Chat SDK wrapper. All API names verified against @nexconn/chat@26.2.1 index.d.ts.
// The SDK touches `window`, so it is only ever loaded with a dynamic import.
import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  messageId: string;
  messageType: string;
  senderUserId: string;
  sentTime: number;
  channelType: number;
  channelId: string;
  content: Record<string, unknown>;
  metadata: Record<string, string>;
};

export type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "offline" | "kicked" | "needs_reconnect" | "not_configured" | "error";

type Sdk = typeof import("@nexconn/chat");

export const CUSTOM_TYPES = ["BTN:Incident", "BTN:Status", "BTN:Nudge"] as const;

type Listeners = {
  message: Set<(m: ChatMessage) => void>;
  metadata: Set<(e: { messageId: string; metadata: Record<string, string> }) => void>;
  state: Set<(s: ConnectionState, code?: number) => void>;
};

// One connection per page (per tab). Each role view runs in its own tab/device.
const conn = {
  sdk: null as Sdk | null,
  initialized: false,
  userId: null as string | null,
  state: "idle" as ConnectionState,
  listeners: { message: new Set(), metadata: new Set(), state: new Set() } as Listeners,
};

function setState(s: ConnectionState, code?: number) {
  conn.state = s;
  conn.listeners.state.forEach((l) => l(s, code));
}

export function toChatMessage(m: {
  messageId: string;
  messageType: string;
  senderUserId: string;
  sentTime: number;
  channelIdentifier: { channelType: number; channelId: string };
  content: unknown;
  metadata?: Map<string, string> | Record<string, string> | null;
}): ChatMessage {
  const md = m.metadata instanceof Map ? Object.fromEntries(m.metadata) : (m.metadata ?? {});
  return {
    messageId: m.messageId,
    messageType: m.messageType,
    senderUserId: m.senderUserId,
    sentTime: m.sentTime,
    channelType: m.channelIdentifier.channelType,
    channelId: m.channelIdentifier.channelId,
    content: (m.content ?? {}) as Record<string, unknown>,
    metadata: md as Record<string, string>,
  };
}

type TokenResponse = { appKey: string; dataCenter: "SG" | "NA" | "SA"; userId: string; token: string };

async function fetchToken(eventId: string, role: string, refresh = false): Promise<TokenResponse | "not_configured"> {
  const res = await fetch(`/api/session/token?event=${encodeURIComponent(eventId)}&role=${role}${refresh ? "&refresh=1" : ""}`, { cache: "no-store" });
  if (res.status === 503) return "not_configured";
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message ?? `Token request failed (${res.status})`);
  return res.json();
}

/** Initialises the SDK once, registers handlers, then connects once (the SDK reconnects by itself). */
export async function connect(eventId: string, role: "member" | "organizer" | "attendee"): Promise<string | null> {
  if (conn.state === "connected" && conn.userId) return conn.userId;
  setState("connecting");
  const tok = await fetchToken(eventId, role);
  if (tok === "not_configured") {
    setState("not_configured");
    return null;
  }
  const sdk = (conn.sdk ??= await import("@nexconn/chat"));
  const { NCEngine, ConnectionStatusHandler, MessageHandler, AreaCode, LogLevel } = sdk;
  if (!conn.initialized) {
    NCEngine.initialize({
      appKey: tok.appKey,
      areaCode: tok.dataCenter === "NA" ? AreaCode.NA : tok.dataCenter === "SA" ? AreaCode.SA : AreaCode.SG,
      logLevel: process.env.NODE_ENV === "production" ? LogLevel.WARN : LogLevel.DEBUG,
    });
    // Custom types must be registered before connect (docs: chatsdk-web/message/customize).
    NCEngine.registerCustomMessages(CUSTOM_TYPES.map((messageType) => ({ messageType, isPersisted: true, isCounted: messageType !== "BTN:Status" })));
    NCEngine.addConnectionStatusHandler(
      "baton",
      new ConnectionStatusHandler({
        onConnectionStatusChanged({ status, code }) {
          // RCConnectionStatus: 0 CONNECTED, 1 CONNECTING, 2 DISCONNECTED, 3 SUSPENDED (auto-retry in 5 s)
          if (status === 0) setState("connected");
          else if (status === 1) setState(conn.state === "connected" || conn.state === "offline" ? "reconnecting" : "connecting");
          else if (status === 3) setState("offline", code);
          else if (code === 31010) setState("kicked", code);
          else if (code === 33007) setState("needs_reconnect", code);
          else setState("offline", code);
        },
      }),
    );
    NCEngine.addMessageHandler(
      "baton",
      new MessageHandler({
        onMessageReceived({ messages }) {
          for (const m of messages) conn.listeners.message.forEach((l) => l(toChatMessage(m)));
        },
        onMessageMetadataUpdated({ messageId, metadata }) {
          conn.listeners.metadata.forEach((l) => l({ messageId, metadata }));
        },
      }),
    );
    conn.initialized = true;
  }
  let result = await NCEngine.connect({ token: tok.token });
  if (!result.isOk && result.code === 31004) {
    // Token invalid/expired → ask our server for a fresh one, once.
    const fresh = await fetchToken(eventId, role, true);
    if (fresh !== "not_configured") result = await NCEngine.connect({ token: fresh.token });
  }
  if (!result.isOk) {
    setState("error", result.code);
    throw new Error(`Could not connect to messaging (code ${result.code})`);
  }
  conn.userId = result.data?.userId ?? tok.userId;
  setState("connected");
  return conn.userId;
}

export function onMessage(fn: (m: ChatMessage) => void) {
  conn.listeners.message.add(fn);
  return () => {
    conn.listeners.message.delete(fn);
  };
}
export function onMetadata(fn: (e: { messageId: string; metadata: Record<string, string> }) => void) {
  conn.listeners.metadata.add(fn);
  return () => {
    conn.listeners.metadata.delete(fn);
  };
}

export async function sendGroupText(groupId: string, text: string): Promise<ChatMessage> {
  const sdk = conn.sdk;
  if (!sdk || conn.state !== "connected") throw new Error("Not connected — your message was not sent");
  const params = new sdk.SendTextMessageParams({ text });
  // Enable metadata on crew messages so the server can later turn one into a request card in place.
  params.metadata = { b: "1" };
  const res = await new sdk.GroupChannel(groupId).sendMessage(params);
  if (!res.isOk || !res.data) throw new Error(res.code === 30004 ? "Slow down — sending too fast" : `Message not sent (code ${res.code})`);
  return toChatMessage(res.data);
}

export async function loadHistory(kind: "group" | "direct", targetId: string, pageSize = 50): Promise<ChatMessage[]> {
  const sdk = conn.sdk;
  if (!sdk) return [];
  const identifier = kind === "group" ? new sdk.GroupChannel(targetId).identifier : new sdk.DirectChannel(targetId).identifier;
  const query = sdk.BaseChannel.createMessagesQuery({ channelIdentifier: identifier, startTime: Date.now(), pageSize, isAscending: false });
  const res = await query.loadNextPage();
  if (!res.isOk || !res.data) return [];
  return res.data.data.map(toChatMessage).sort((a, b) => a.sentTime - b.sentTime);
}

/** React hook: connection state for the current page's single Nexconn session. */
export function useNexconn(eventId: string | null, role: "member" | "organizer" | "attendee", enabled = true) {
  const [state, setLocal] = useState<ConnectionState>(conn.state);
  const [code, setCode] = useState<number | undefined>();
  const [userId, setUserId] = useState<string | null>(conn.userId);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const l = (s: ConnectionState, c?: number) => {
      setLocal(s);
      setCode(c);
    };
    conn.listeners.state.add(l);
    return () => {
      conn.listeners.state.delete(l);
    };
  }, []);

  useEffect(() => {
    if (!eventId || !enabled || started.current) return;
    started.current = true;
    connect(eventId, role)
      .then(setUserId)
      .catch((e: Error) => setError(e.message));
  }, [eventId, role, enabled]);

  const retry = () => {
    setError(null);
    conn.state = "idle";
    connect(eventId!, role).then(setUserId).catch((e: Error) => setError(e.message));
  };

  return { state, code, userId, error, retry };
}
