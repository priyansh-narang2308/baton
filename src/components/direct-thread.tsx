"use client";

import { useEffect, useRef, useState } from "react";
import { clearDirectUnread, DIRECT, onMessage } from "@/lib/nexconn-client";
import { CHAT_UI_DETAIL_TAG, chatUiReady, fitToContainer, onChatUiSend, openDirect, prefillInput, rememberProfiles } from "@/lib/nexconn-chatui";
import { SdkDirectThread } from "./direct-thread-sdk";

type Props = { peerUserId: string; peerName: string; meUserId: string | null; connected: boolean; draft?: string; onActivity?: () => void };

/**
 * A private Nexconn direct channel between two crew members, rendered by Nexconn Chat UI (its conversation pane,
 * `nc-channel-detail-provider`; Baton's own inbox lists the conversations). Chat UI shares the page's single
 * Nexconn session; if it failed to load, the SDK-based thread is used instead so messaging never breaks.
 */
export function DirectThread(props: Props) {
  const { connected } = props;
  if (connected && !chatUiReady()) return <SdkDirectThread {...props} />;
  return <ChatUiThread {...props} />;
}

function ChatUiThread({ peerUserId, peerName, meUserId, connected, draft, onActivity }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const activity = useRef(onActivity);
  useEffect(() => {
    activity.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    rememberProfiles([{ nexconnUserId: peerUserId, name: peerName }]);
  }, [peerUserId, peerName]);

  useEffect(() => {
    const el = host.current;
    if (!connected || !el) return;
    let cancelled = false;
    const root = document.createElement(CHAT_UI_DETAIL_TAG);
    root.style.display = "block";
    root.style.width = "100%";
    root.style.height = "100%";
    el.appendChild(root);
    fitToContainer(root);
    openDirect(peerUserId)
      .then(async () => {
        if (cancelled) return;
        setError(null);
        // A "Re #N …" draft from an incident: wait for Chat UI to render its input, then fill it.
        for (let i = 0; draft && i < 20 && !cancelled && !prefillInput(root, draft); i++) await new Promise((r) => setTimeout(r, 150));
        void clearDirectUnread(peerUserId).then(() => activity.current?.());
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
      root.remove();
    };
    // The draft only seeds the input when the conversation is first opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, peerUserId]);

  useEffect(() => {
    const offSend = onChatUiSend((peer) => {
      if (peer === peerUserId) setTimeout(() => activity.current?.(), 500);
    });
    const offMsg = onMessage((m) => {
      if (m.channelType !== DIRECT || m.channelId !== peerUserId) return;
      void clearDirectUnread(peerUserId).then(() => activity.current?.());
    });
    return () => {
      offSend();
      offMsg();
    };
  }, [peerUserId]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" data-me={meUserId ?? undefined}>
      {!connected && <p className="py-6 text-center text-sm text-text-3">Connecting to messaging…</p>}
      {error && (
        <p role="alert" className="px-4 py-3 text-center text-[13px] text-danger">
          {error}
        </p>
      )}
      <div ref={host} className="nc-host min-h-[360px] flex-1" aria-label={`Private conversation with ${peerName}`} />
    </div>
  );
}
