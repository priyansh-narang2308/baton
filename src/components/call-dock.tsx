"use client";

import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";
import { acceptHuddle, hangUp, toggleMic, useCall } from "@/lib/nexconn-call";
import { cx } from "./ui";

function elapsed(from: number, now: number) {
  const s = Math.max(0, Math.floor((now - from) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** The voice huddle in progress, pinned above the page on every crew and organizer screen. */
export function CallDock() {
  const ui = useCall();
  const [now, setNow] = useState(() => Date.now());
  const connected = ui.phase === "connected";
  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [connected]);

  if (ui.phase === "idle") return null;

  const btn = "grid size-11 place-items-center rounded-full transition-opacity disabled:opacity-50";
  return (
    <div
      role={ui.phase === "incoming" ? "alertdialog" : "status"}
      aria-live="polite"
      aria-label="Voice huddle"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-border bg-surface p-3 shadow-xl lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0 lg:w-96"
    >
      {ui.phase === "ended" ? (
        <p className="flex items-center gap-2 px-1 py-2 text-sm">
          <PhoneOff className="size-4 text-text-3" aria-hidden /> {ui.message}
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <span
            className={cx(
              "grid size-10 shrink-0 place-items-center rounded-full font-semibold text-white",
              ui.phase === "connected" ? "bg-done" : "bg-brand",
              ui.phase !== "connected" && "animate-pulse",
            )}
            aria-hidden
          >
            {ui.peerName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {ui.phase === "incoming"
                ? `${ui.peerName} is calling`
                : ui.phase === "outgoing"
                  ? `Calling ${ui.peerName}…`
                  : `${ui.peerName} · ${ui.connectedAt ? elapsed(ui.connectedAt, now) : "00:00"}`}
            </p>
            <p className="truncate text-xs text-text-3">
              Voice huddle about #{ui.ctx.incidentNumber} {ui.ctx.incidentTitle} · Nexconn Call
            </p>
          </div>
          {ui.phase === "incoming" && (
            <>
              <button type="button" onClick={() => void hangUp()} disabled={ui.busy} className={cx(btn, "bg-urgent text-white")} aria-label="Decline">
                <PhoneOff className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => void acceptHuddle()} disabled={ui.busy} className={cx(btn, "bg-done text-white")} aria-label="Answer">
                <Phone className="size-5" aria-hidden />
              </button>
            </>
          )}
          {ui.phase === "connected" && (
            <button
              type="button"
              onClick={() => void toggleMic()}
              className={cx(btn, ui.micOn ? "bg-surface-2 text-text" : "bg-text text-bg")}
              aria-label={ui.micOn ? "Mute" : "Unmute"}
              aria-pressed={!ui.micOn}
            >
              {ui.micOn ? <Mic className="size-5" aria-hidden /> : <MicOff className="size-5" aria-hidden />}
            </button>
          )}
          {ui.phase !== "incoming" && (
            <button
              type="button"
              onClick={() => void hangUp()}
              disabled={ui.busy && ui.phase === "outgoing" && !ui.callId}
              className={cx(btn, "bg-urgent text-white")}
              aria-label={ui.phase === "outgoing" ? "Cancel call" : "Hang up"}
            >
              <PhoneOff className="size-5" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
