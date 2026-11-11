"use client";

import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DIRECT, listDirectThreads, messageText, onMessage, type DirectThreadSummary } from "@/lib/nexconn-client";
import type { CrewMemberView } from "@/lib/types";
import { cx, timeAgo } from "./ui";

/** Direct conversations for the current user, kept fresh from Nexconn (server-side channel list + live messages). */
export function useDirectThreads(connected: boolean, crew: CrewMemberView[] | undefined, meUserId: string | null | undefined) {
  const [threads, setThreads] = useState<DirectThreadSummary[] | null>(null);
  const peers = (crew ?? []).filter((c) => c.nexconnUserId !== meUserId && !c.isSimulated).map((c) => c.nexconnUserId).join(",");
  const refresh = useCallback(() => {
    if (!connected || !peers) return;
    listDirectThreads(peers.split(","))
      .then(setThreads)
      .catch(() => setThreads((t) => t ?? []));
  }, [connected, peers]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(
    () =>
      onMessage((m) => {
        if (m.channelType === DIRECT) refresh();
      }),
    [refresh],
  );
  const unread = threads?.reduce((n, t) => n + t.unreadCount, 0) ?? 0;
  return { threads, unread, refresh };
}

export function Inbox({ threads, crew, meId, now, onOpen, onStart }: { threads: DirectThreadSummary[] | null; crew: CrewMemberView[]; meId: string | null; now: number; onOpen: (m: CrewMemberView) => void; onStart?: () => void }) {
  const byUser = new Map(crew.map((c) => [c.nexconnUserId, c]));
  const known = (threads ?? []).filter((t) => byUser.has(t.peerUserId));
  if (threads === null && crew.length > 1) return <p className="p-4 text-center text-sm text-text-3">Loading conversations…</p>;
  if (known.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-3">
        <MessageCircle className="mx-auto mb-2 size-5" aria-hidden />
        No direct messages yet.
        {onStart && (
          <>
            {" "}
            <button onClick={onStart} className="font-medium text-accent underline-offset-2 hover:underline">
              Message someone on the crew
            </button>
          </>
        )}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {known.map((t) => {
        const peer = byUser.get(t.peerUserId)!;
        const last = t.latest;
        return (
          <li key={t.peerUserId}>
            <button onClick={() => onOpen(peer)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold">{peer.name.slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={cx("flex-1 truncate text-sm", t.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                    {peer.name}
                    {peer.role === "lead" && <span className="font-normal text-text-3"> · lead</span>}
                  </span>
                  {last && <span className="shrink-0 text-[11px] text-text-3">{timeAgo(last.sentTime, now)}</span>}
                </span>
                <span className={cx("block truncate text-[13px]", t.unreadCount > 0 ? "text-text" : "text-text-3")}>
                  {last ? `${last.senderUserId === byUser.get(t.peerUserId)?.nexconnUserId ? "" : meId ? "You: " : ""}${messageText(last)}` : "No messages"}
                </span>
              </span>
              {t.unreadCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">{t.unreadCount}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
