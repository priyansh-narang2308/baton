"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clearDirectUnread, DIRECT, loadHistory, messageText, onMessage, sendDirectText, type ChatMessage } from "@/lib/nexconn-client";
import { Button, cx, inputClass } from "./ui";

/**
 * Fallback used only if Nexconn Chat UI could not load. A Nexconn direct channel between two crew members
 * (organizer ↔ volunteer). Nexconn stores the history; we load the last page, append live messages and clear the unread count while the thread is open.
 */
export function SdkDirectThread({ peerUserId, peerName, meUserId, connected, draft = "", onActivity }: { peerUserId: string; peerName: string; meUserId: string | null; connected: boolean; draft?: string; onActivity?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState(draft);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    loadHistory("direct", peerUserId, 50)
      .then((h) => {
        if (cancelled) return;
        setMessages((cur) => merge(h, cur ?? []));
        void clearDirectUnread(peerUserId).then(() => onActivity?.());
      })
      .catch(() => !cancelled && setMessages([]));
    return () => {
      cancelled = true;
    };
  }, [connected, peerUserId, onActivity]);

  useEffect(
    () =>
      onMessage((m) => {
        if (m.channelType !== DIRECT || m.channelId !== peerUserId) return;
        setMessages((cur) => merge(cur ?? [], [m]));
        void clearDirectUnread(peerUserId).then(() => onActivity?.());
      }),
    [peerUserId, onActivity],
  );

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      const m = await sendDirectText(peerUserId, body);
      setMessages((cur) => merge(cur ?? [], [m]));
      setText("");
      onActivity?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ol className="min-h-40 flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-label={`Messages with ${peerName}`}>
        {!connected && <li className="py-6 text-center text-sm text-text-3">Connecting to messaging…</li>}
        {connected && messages === null && <li className="py-6 text-center text-sm text-text-3">Loading messages…</li>}
        {messages?.length === 0 && <li className="py-6 text-center text-sm text-text-3">No messages with {peerName} yet. Only the two of you see this conversation.</li>}
        {messages?.map((m) => {
          const own = m.senderUserId === meUserId;
          return (
            <li key={m.messageId} className={cx("flex flex-col", own ? "items-end" : "items-start")}>
              <span className={cx("max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px]", own ? "bg-accent text-accent-ink" : "border border-border bg-surface")}>{messageText(m)}</span>
              <span className="mt-0.5 px-1 text-[11px] text-text-3">{new Date(m.sentTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          );
        })}
        <div ref={bottom} />
      </ol>
      <div className="border-t border-border bg-surface px-3 py-2.5">
        {error && (
          <p role="alert" className="mb-2 text-[13px] text-danger">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            // A prefilled "Re #N …" draft is focused with the caret after it, ready to type.
            autoFocus={Boolean(draft)}
            onFocus={(e) => {
              const len = e.currentTarget.value.length;
              e.currentTarget.setSelectionRange(len, len);
            }}
            placeholder={connected ? `Message ${peerName}` : "Connecting…"}
            aria-label={`Message ${peerName}`}
            className={cx(inputClass, "min-h-10 resize-none py-2 text-[15px]")}
          />
          <Button variant="primary" busy={sending} disabled={!connected || !text.trim()} aria-label="Send" onClick={send} className="w-10 px-0">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function merge(a: ChatMessage[], b: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  for (const m of [...a, ...b]) byId.set(m.messageId, m);
  return [...byId.values()].sort((x, y) => x.sentTime - y.sentTime);
}
