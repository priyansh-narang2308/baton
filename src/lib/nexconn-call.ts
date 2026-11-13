"use client";

// Voice and video huddles over Nexconn Call (@nexconn/call 26.2.1). API names verified against its index.d.ts and the
// "Make your first call" / "1-to-1 call" docs. Call signalling rides the Chat connection from nexconn-client.ts,
// so `NCCallEngine.install()` runs before `NCEngine.initialize` and the handler is registered before `connect`.
import { useSyncExternalStore } from "react";

type CallSdk = typeof import("@nexconn/call");
type Engine = ReturnType<CallSdk["NCCallEngine"]["initialize"]>;

/** Sent to the callee as the call's `extra`, so they see what the huddle is about before answering. */
export type HuddleContext = {
  eventId: string;
  incidentId: string;
  incidentNumber: number;
  incidentTitle: string;
  callerName: string;
  callerMemberId: string;
  calleeMemberId: string;
  /** Video huddle (audio + camera) rather than voice only. */
  video?: boolean;
};

export type CallUi =
  | { phase: "idle" }
  | {
      phase: "outgoing" | "incoming" | "connected";
      callId: string | null;
      peerName: string;
      ctx: HuddleContext;
      connectedAt: number | null;
      micOn: boolean;
      busy: boolean;
      /** Nexconn user ID of the other person (their video stream is bound to it). */
      peerUserId: string;
      video: boolean;
      camOn: boolean;
      /** False once the other person turns their camera off. */
      peerCamOn: boolean;
    }
  | { phase: "ended"; peerName: string; message: string };

/** A huddle is for a quick word about one incident; this keeps a forgotten call from using up free minutes. */
const MAX_CALL_MS = 10 * 60_000;

const state = {
  sdk: null as CallSdk | null,
  engine: null as Engine | null,
  ui: { phase: "idle" } as CallUi,
  /** Query suffix for the logging request (organizer pages act as the organizer's crew member). */
  q: "",
  capTimer: null as ReturnType<typeof setTimeout> | null,
  hideTimer: null as ReturnType<typeof setTimeout> | null,
  ring: null as { stop: () => void } | null,
  video: null as HTMLVideoElement | null,
  remoteVideo: null as HTMLVideoElement | null,
  listeners: new Set<() => void>(),
};

function set(ui: CallUi) {
  state.ui = ui;
  if (ui.phase === "incoming") startRing();
  else stopRing();
  state.listeners.forEach((l) => l());
}

function patch(p: Partial<Extract<CallUi, { phase: "outgoing" | "incoming" | "connected" }>>) {
  const ui = state.ui;
  if (ui.phase === "idle" || ui.phase === "ended") return;
  set({ ...ui, ...p } as CallUi);
}

function subscribe(l: () => void) {
  state.listeners.add(l);
  return () => state.listeners.delete(l);
}

const IDLE: CallUi = { phase: "idle" };
export function useCall(): CallUi {
  return useSyncExternalStore(subscribe, () => state.ui, () => IDLE);
}

/**
 * The two <video> elements the SDK plays into. They live outside React so the SDK's binding survives re-renders;
 * the call dock moves them into its video stage while a video huddle is on screen.
 */
export function videoElements() {
  return { local: ensureVideo("local"), remote: ensureVideo("remote") };
}

function ensureVideo(which: "local" | "remote") {
  const key = which === "local" ? "video" : "remoteVideo";
  if (!state[key]) {
    const v = document.createElement("video");
    v.muted = which === "local"; // never play your own microphone back; the SDK plays remote audio itself
    v.playsInline = true;
    v.autoplay = true;
    v.style.display = "none";
    v.dataset.huddleVideo = which;
    document.body.appendChild(v);
    state[key] = v;
  }
  return state[key]!;
}

/** Puts the elements back in their hidden parking spot when no video huddle is showing. */
function parkVideos() {
  for (const v of [state.video, state.remoteVideo]) {
    if (!v) continue;
    v.style.display = "none";
    v.pause();
    v.srcObject = null; // release the finished call's stream
    if (v.parentElement !== document.body) document.body.appendChild(v);
  }
}

/** True once the Call engine is set up on this page (crew and organizer pages, after connecting). */
export function useCallReady(): boolean {
  return useSyncExternalStore(subscribe, () => state.engine !== null, () => false);
}

/** Load the Call SDK and run its install step. Must happen before NCEngine.initialize. */
export async function installCall(): Promise<void> {
  if (state.sdk) return;
  const sdk = await import("@nexconn/call");
  sdk.NCCallEngine.install();
  state.sdk = sdk;
}

function parseCtx(extra: string | undefined): HuddleContext | null {
  if (!extra) return null;
  try {
    const c = JSON.parse(extra) as HuddleContext;
    return typeof c.incidentId === "string" && typeof c.callerName === "string" ? c : null;
  } catch {
    return null;
  }
}

function endedMessage(reason: number, wasConnected: boolean, outgoing: boolean, peer: string): string {
  const R = state.sdk!.NCCallEndReason;
  if (wasConnected) return "Huddle ended";
  switch (reason) {
    case R.NO_ANSWER:
      return `${peer} didn't answer`;
    case R.DECLINED:
      return `${peer} declined`;
    case R.CANCELED:
      return outgoing ? "Call cancelled" : `${peer} hung up`;
    case R.MISSED:
      return `Missed call from ${peer}`;
    case R.ACCEPT_BY_OTHER_CLIENT:
      return "Answered on another device";
    default:
      return outgoing ? `Couldn't reach ${peer}` : "Call ended";
  }
}

function outcomeFor(reason: number, wasConnected: boolean) {
  const R = state.sdk!.NCCallEndReason;
  if (wasConnected) return "connected" as const;
  if (reason === R.NO_ANSWER) return "no_answer" as const;
  if (reason === R.DECLINED) return "declined" as const;
  if (reason === R.CANCELED) return "cancelled" as const;
  return "failed" as const;
}

/** Creates the Call engine and registers its handlers. Call after NCEngine.initialize and before connect. */
export function setupCall(q: string) {
  state.q = q;
  if (state.engine || !state.sdk) return;
  const { NCCallEngine } = state.sdk;
  const engine = NCCallEngine.initialize({});


  engine.setCallEventHandler({
    async onCallReceived({ session, extra }) {
      const callId = session.getCallId();
      const ctx = parseCtx(extra);
      // Only Baton huddles, and one at a time: anything else is turned down rather than silently ignored.
      if (!ctx || (state.ui.phase !== "idle" && state.ui.phase !== "ended")) {
        await engine.endCall({ callId });
        return;
      }
      clearHide();
      const video = session.getMediaType() === state.sdk!.NCCallMediaType.AUDIO_VIDEO;
      set({
        phase: "incoming",
        callId,
        peerName: ctx.callerName,
        ctx,
        connectedAt: null,
        micOn: true,
        busy: false,
        peerUserId: session.getCallerUserId(),
        video,
        camOn: video,
        peerCamOn: video,
      });
    },
    onRemoteCameraStateChanged({ disabled }) {
      patch({ peerCamOn: !disabled });
    },
    onCallConnected() {
      patch({ phase: "connected", connectedAt: Date.now(), busy: false });
      clearCap();
      state.capTimer = setTimeout(() => void hangUp(), MAX_CALL_MS);
    },
    onStartTimeReceived({ startTime }) {
      if (state.ui.phase === "connected" && startTime > 0) patch({ connectedAt: startTime });
    },
    onCallEnded({ session, reason }) {
      const ui = state.ui;
      clearCap();
      if (ui.phase === "idle" || ui.phase === "ended") return;
      const wasConnected = ui.connectedAt !== null;
      const outgoing = isCaller(ui.ctx);
      if (outgoing) {
        const durationSec = wasConnected ? Math.round((Date.now() - (ui.connectedAt ?? Date.now())) / 1000) : 0;
        void logHuddle(ui.ctx, session.getCallId(), outcomeFor(reason, wasConnected), durationSec);
      }
      if (ui.video) engine.removeVideoView([ui.peerUserId]);
      parkVideos();
      set({ phase: "ended", peerName: ui.peerName, message: endedMessage(reason, wasConnected, outgoing, ui.peerName) });
      state.hideTimer = setTimeout(() => set({ phase: "idle" }), 4000);
    },
  });
  state.engine = engine;
  state.listeners.forEach((l) => l());
}

/**
 * The docs ask for a local view before placing or answering. It needs the connected user, so it is bound just before
 * each call. For a video huddle the remote view is bound up front too (the docs allow binding it in advance); for a
 * voice huddle both elements stay hidden.
 */
function bindViews(engine: Engine, peerUserId: string, video: boolean) {
  const { local, remote } = videoElements();
  engine.setLocalVideoView({ videoElement: local });
  if (video) engine.setRemoteVideoView([{ userId: peerUserId, videoElement: remote, enableLowResolutionStream: false }]);
}

/** Who placed the call is remembered per page; the callee never logs, so each call is recorded once. */
const placed = new Set<string>();
function isCaller(ctx: HuddleContext) {
  return placed.has(`${ctx.incidentId}:${ctx.calleeMemberId}`);
}

const logged = new Set<(incidentId: string) => void>();
/** Lets an open incident re-read its timeline once a huddle about it has been written. */
export function onHuddleLogged(fn: (incidentId: string) => void) {
  logged.add(fn);
  return () => {
    logged.delete(fn);
  };
}

async function logHuddle(ctx: HuddleContext, callId: string, outcome: string, durationSec: number) {
  placed.delete(`${ctx.incidentId}:${ctx.calleeMemberId}`);
  try {
    await fetch(`/api/events/${ctx.eventId}/incidents/${ctx.incidentId}/huddle${state.q}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId, withMemberId: ctx.calleeMemberId, outcome, durationSec, video: Boolean(ctx.video) }),
    });
    logged.forEach((l) => l(ctx.incidentId));
  } catch {
    // The call itself already happened; a missing timeline line is not worth interrupting anyone for.
  }
}

function clearCap() {
  if (state.capTimer) clearTimeout(state.capTimer);
  state.capTimer = null;
}
function clearHide() {
  if (state.hideTimer) clearTimeout(state.hideTimer);
  state.hideTimer = null;
}

/** Rings a teammate's Baton page about one incident, as a voice huddle or (with `ctx.video`) a video huddle. */
export async function startHuddle(ctx: HuddleContext, peerUserId: string, peerName: string) {
  const engine = state.engine;
  const sdk = state.sdk;
  if (!engine || !sdk) throw new Error("Calling isn't ready on this page yet");
  if (state.ui.phase !== "idle" && state.ui.phase !== "ended") throw new Error("You're already in a call");
  clearHide();
  placed.add(`${ctx.incidentId}:${ctx.calleeMemberId}`);
  const video = Boolean(ctx.video);
  set({ phase: "outgoing", callId: null, peerName, ctx, connectedAt: null, micOn: true, busy: true, peerUserId, video, camOn: video, peerCamOn: video });
  bindViews(engine, peerUserId, video);
  const { code, callId } = await engine.startCall({
    calleeIds: [peerUserId],
    callType: sdk.NCCallType.SINGLE,
    mediaType: video ? sdk.NCCallMediaType.AUDIO_VIDEO : sdk.NCCallMediaType.AUDIO,
    extra: JSON.stringify(ctx),
  });
  if (code !== 0 || !callId) {
    placed.delete(`${ctx.incidentId}:${ctx.calleeMemberId}`);
    if (video) engine.removeVideoView([peerUserId]);
    parkVideos();
    set({ phase: "ended", peerName, message: micHint(`Couldn't start the call (code ${code})`, code, video) });
    state.hideTimer = setTimeout(() => set({ phase: "idle" }), 6000);
    return;
  }
  if ((state.ui as CallUi).phase === "outgoing") patch({ callId, busy: false });
}

// 53012: the SDK's code when the browser refuses the microphone (seen in its log as getUserMedia "Permission denied").
const MIC_DENIED = 53012;

function micHint(fallback: string, code?: number, video = false) {
  const devices = video ? "camera and microphone" : "microphone";
  if (code === MIC_DENIED) return `Your ${devices} ${video ? "are" : "is"} blocked. Allow ${video ? "them" : "it"} for this site (icon in the address bar), then call again.`;
  // Browsers refuse the microphone over plain http or after the user blocked it; say so instead of a bare code.
  return typeof navigator !== "undefined" && !navigator.mediaDevices
    ? `This browser can't use the ${devices} here (needs https)`
    : `${fallback}. Check that the browser may use your ${devices}.`;
}

export async function acceptHuddle() {
  const ui = state.ui;
  if (ui.phase !== "incoming" || !ui.callId || !state.engine) return;
  patch({ busy: true });
  bindViews(state.engine, ui.peerUserId, ui.video);
  const { code } = await state.engine.acceptCall({ callId: ui.callId });
  if (code !== 0) {
    await state.engine.endCall({ callId: ui.callId }).catch(() => undefined);
    if (ui.video) state.engine.removeVideoView([ui.peerUserId]);
    parkVideos();
    set({ phase: "ended", peerName: ui.peerName, message: micHint(`Couldn't answer (code ${code})`, code, ui.video) });
    state.hideTimer = setTimeout(() => set({ phase: "idle" }), 6000);
  }
}

/** Hang up, cancel an outgoing call, or decline an incoming one. */
export async function hangUp() {
  const ui = state.ui;
  if (ui.phase === "idle" || ui.phase === "ended" || !state.engine) return;
  patch({ busy: true });
  await state.engine.endCall(ui.callId ? { callId: ui.callId } : undefined).catch(() => undefined);
}

export async function toggleMic() {
  const ui = state.ui;
  if (ui.phase !== "connected" || !state.engine) return;
  const next = !ui.micOn;
  const { code } = await state.engine.enableMicrophone(next);
  if (code === 0) patch({ micOn: next });
}

/** Turns the camera off or back on during a video huddle (the other side gets onRemoteCameraStateChanged). */
export async function toggleCamera() {
  const ui = state.ui;
  if (ui.phase !== "connected" || !ui.video || !state.engine) return;
  const next = !ui.camOn;
  const { code } = await state.engine.enableCamera(next);
  if (code === 0) patch({ camOn: next });
}

/** A soft two-tone ring while a call is incoming. Silent if the browser hasn't allowed audio yet. */
function startRing() {
  if (state.ring || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const beep = () => {
      for (const [f, t] of [[880, 0], [660, 0.25]] as const) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.22);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.24);
      }
    };
    beep();
    const timer = setInterval(beep, 1800);
    state.ring = {
      stop: () => {
        clearInterval(timer);
        void ctx.close();
      },
    };
  } catch {
    state.ring = null;
  }
}
function stopRing() {
  state.ring?.stop();
  state.ring = null;
}
