"use client";

import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { acceptHuddle, hangUp, toggleCamera, toggleMic, useCall, videoElements } from "@/lib/nexconn-call";
import { cx } from "./ui";

function elapsed(from: number, now: number) {
  const s = Math.max(0, Math.floor((now - from) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** The voice or video huddle in progress, pinned above the page on every crew and organizer screen. */
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

  const video = ui.phase !== "ended" && ui.video;
  // The stage shows once this side has joined the media: while ringing out, and after answering.
  const showStage = video && (ui.phase === "outgoing" || ui.phase === "connected");
  const kind = video ? "Video huddle" : "Voice huddle";
  const btn = "grid size-11 place-items-center rounded-full transition-opacity disabled:opacity-50";
  return (
    <div
      role={ui.phase === "incoming" ? "alertdialog" : "status"}
      aria-live="polite"
      aria-label={kind}
      className={cx(
        "fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-border bg-surface p-3 shadow-xl lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0",
        showStage ? "lg:w-[420px]" : "lg:w-96",
      )}
    >
      {ui.phase === "ended" ? (
        <p className="flex items-center gap-2 px-1 py-2 text-sm">
          <PhoneOff className="size-4 text-text-3" aria-hidden /> {ui.message}
        </p>
      ) : (
        <>
          {showStage && <VideoStage peerName={ui.peerName} peerCamOn={ui.peerCamOn} camOn={ui.camOn} waiting={ui.phase === "outgoing"} />}
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
                  ? `${ui.peerName} is ${video ? "video " : ""}calling`
                  : ui.phase === "outgoing"
                    ? `Calling ${ui.peerName}…`
                    : `${ui.peerName} · ${ui.connectedAt ? elapsed(ui.connectedAt, now) : "00:00"}`}
              </p>
              <p className="truncate text-xs text-text-3">
                {kind} about #{ui.ctx.incidentNumber} {ui.ctx.incidentTitle} · Nexconn Call
              </p>
            </div>
            {ui.phase === "incoming" && (
              <>
                <button type="button" onClick={() => void hangUp()} disabled={ui.busy} className={cx(btn, "bg-urgent text-white")} aria-label="Decline">
                  <PhoneOff className="size-5" aria-hidden />
                </button>
                <button type="button" onClick={() => void acceptHuddle()} disabled={ui.busy} className={cx(btn, "bg-done text-white")} aria-label="Answer">
                  {video ? <Video className="size-5" aria-hidden /> : <Phone className="size-5" aria-hidden />}
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
            {ui.phase === "connected" && video && (
              <button
                type="button"
                onClick={() => void toggleCamera()}
                className={cx(btn, ui.camOn ? "bg-surface-2 text-text" : "bg-text text-bg")}
                aria-label={ui.camOn ? "Turn camera off" : "Turn camera on"}
                aria-pressed={!ui.camOn}
              >
                {ui.camOn ? <Video className="size-5" aria-hidden /> : <VideoOff className="size-5" aria-hidden />}
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
        </>
      )}
    </div>
  );
}

/** The other person full-size, you in a small corner tile. The SDK plays into the two <video> elements it was given. */
function VideoStage({ peerName, peerCamOn, camOn, waiting }: { peerName: string; peerCamOn: boolean; camOn: boolean; waiting: boolean }) {
  const remoteBox = useRef<HTMLDivElement>(null);
  const localBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { local, remote } = videoElements();
    for (const [v, box] of [
      [remote, remoteBox.current],
      [local, localBox.current],
    ] as const) {
      if (!box) continue;
      v.className = "h-full w-full object-cover";
      v.style.display = "block";
      box.appendChild(v);
      void v.play().catch(() => undefined);
    }
    // On unmount the call module parks the elements again when the call ends.
  }, []);
  return (
    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-black">
      <div ref={remoteBox} className={cx("absolute inset-0", (waiting || !peerCamOn) && "invisible")} aria-label={`${peerName}'s camera`} />
      {(waiting || !peerCamOn) && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-white/80">
          {waiting ? `Waiting for ${peerName} to answer…` : `${peerName} turned their camera off`}
        </p>
      )}
      <div
        ref={localBox}
        className={cx("absolute bottom-2 right-2 aspect-[3/4] w-24 overflow-hidden rounded-lg border border-white/30 bg-neutral-800 [&>video]:-scale-x-100", !camOn && "invisible")}
        aria-label="Your camera"
      />
    </div>
  );
}
