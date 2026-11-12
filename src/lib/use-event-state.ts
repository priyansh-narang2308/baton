"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onMessage, onMetadata, type ConnectionState } from "./nexconn-client";
import { api, type EventState, type IncidentView } from "./types";

/**
 * Event read model = DB truth from our API, kept live by Nexconn events:
 * - incident card metadata updates patch the matching incident immediately (if their version is newer)
 * - any card event or reconnect schedules a debounced re-read of the authoritative state
 */
export function useEventState(eventId: string, connection: ConnectionState, as?: "organizer") {
  const [state, setState] = useState<EventState | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [flash, setFlash] = useState<Record<string, number>>({}); // incidentId → timestamp of last live change
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasState = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    if (retry.current) clearTimeout(retry.current);
    const attempt = (n: number): Promise<void> =>
      api<EventState>(`/api/events/${eventId}/state${as ? `?as=${as}` : ""}`).then(
        (s) => {
          hasState.current = true;
          setState(s);
          setError(null);
        },
        (e: Error & { code?: string }) => {
          // A background re-read that fails on a flaky network shouldn't put an error over
          // live data the page already has: retry quietly, and only report it if it keeps failing.
          if (hasState.current && e.code !== "forbidden" && n < 3) {
            retry.current = setTimeout(() => void attempt(n + 1), 1500 * 2 ** n);
            return;
          }
          setError({ message: e.message, code: e.code });
        },
      );
    return attempt(0);
  }, [eventId, as]);

  const scheduleRefresh = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(refresh, 250);
  }, [refresh]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const fallback = setInterval(refresh, 30_000); // safety net if a realtime event is ever missed
    return () => {
      clearTimeout(first);
      clearInterval(fallback);
      if (retry.current) clearTimeout(retry.current);
    };
  }, [refresh]);

  useEffect(() => {
    if (connection === "connected") scheduleRefresh();
  }, [connection, scheduleRefresh]);

  useEffect(() => {
    const offMeta = onMetadata(({ messageId, metadata }) => {
      setState((s) => {
        if (!s) return s;
        const idx = s.incidents.findIndex((i) => i.cardMessageId === messageId);
        if (idx < 0) return s;
        const cur = s.incidents[idx];
        const v = Number(metadata.v ?? 0);
        if (v && v <= cur.version) return s; // stale or duplicate projection
        const next: IncidentView = {
          ...cur,
          version: v || cur.version,
          status: (metadata.st as IncidentView["status"]) ?? cur.status,
          reportCount: metadata.n ? Number(metadata.n) : cur.reportCount,
          ownerMemberId: metadata.own !== undefined ? metadata.own || null : cur.ownerMemberId,
          ownerName: metadata.ownN !== undefined ? metadata.ownN || null : cur.ownerName,
          passToMemberId: metadata.pass !== undefined ? metadata.pass || null : cur.passToMemberId,
          passToName: metadata.passN !== undefined ? metadata.passN || null : cur.passToName,
        };
        setFlash((f) => ({ ...f, [cur.id]: Date.now() }));
        const incidents = [...s.incidents];
        incidents[idx] = next;
        return { ...s, incidents };
      });
      scheduleRefresh();
    });
    const offMsg = onMessage((m) => {
      if (m.messageType === "BTN:Incident" || m.messageType === "BTN:Nudge") scheduleRefresh();
    });
    return () => {
      offMeta();
      offMsg();
    };
  }, [scheduleRefresh]);

  const patchIncident = useCallback((id: string, patch: Partial<IncidentView>) => {
    setState((s) => (s ? { ...s, incidents: s.incidents.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : s));
  }, []);

  return { state, error, refresh, patchIncident, flash };
}
