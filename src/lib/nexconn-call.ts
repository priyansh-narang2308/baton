"use client";

// Voice huddles over Nexconn Call (@nexconn/call 26.2.1). API names verified against its index.d.ts and the
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
      set({ phase: "incoming", callId, peerName: ctx.callerName, ctx, connectedAt: null, micOn: true, busy: false });
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
      set({ phase: "ended", peerName: ui.peerName, message: endedMessage(reason, wasConnected, outgoing, ui.peerName) });
      state.hideTimer = setTimeout(() => set({ phase: "idle" }), 4000);
    },
  });
  state.engine = engine;
  state.listeners.forEach((l) => l());
}

/**
 * The docs ask for a local view before placing or answering. It needs the connected user, so it is bound just before
 * each call; huddles are audio-only, so the element stays hidden.
 */
function bindLocalView(engine: Engine) {
  if (!state.video) {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.style.display = "none";
    document.body.appendChild(v);
    state.video = v;
  }
  engine.setLocalVideoView({ videoElement: state.video });
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
      body: JSON.stringify({ callId, withMemberId: ctx.calleeMemberId, outcome, durationSec }),
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

/** Rings a teammate's Baton page about one incident. Audio only. */
export async function startHuddle(ctx: HuddleContext, peerUserId: string, peerName: string) {
  const engine = state.engine;
  const sdk = state.sdk;
  if (!engine || !sdk) throw new Error("Calling isn't ready on this page yet");
  if (state.ui.phase !== "idle" && state.ui.phase !== "ended") throw new Error("You're already in a call");
  clearHide();
  placed.add(`${ctx.incidentId}:${ctx.calleeMemberId}`);
  set({ phase: "outgoing", callId: null, peerName, ctx, connectedAt: null, micOn: true, busy: true });
  bindLocalView(engine);
  const { code, callId } = await engine.startCall({
    calleeIds: [peerUserId],
    callType: sdk.NCCallType.SINGLE,
    mediaType: sdk.NCCallMediaType.AUDIO,
    extra: JSON.stringify(ctx),
  });
  if (code !== 0 || !callId) {
    placed.delete(`${ctx.incidentId}:${ctx.calleeMemberId}`);
    set({ phase: "ended", peerName, message: micHint(`Couldn't start the call (code ${code})`, code) });
    state.hideTimer = setTimeout(() => set({ phase: "idle" }), 6000);
    return;
  }
  if ((state.ui as CallUi).phase === "outgoing") patch({ callId, busy: false });
}

// 53012: the SDK's code when the browser refuses the microphone (seen in its log as getUserMedia "Permission denied").
const MIC_DENIED = 53012;

function micHint(fallback: string, code?: number) {
  if (code === MIC_DENIED) return "Your microphone is blocked. Allow it for this site (icon in the address bar), then call again.";
  // Browsers refuse the microphone over plain http or after the user blocked it; say so instead of a bare code.
  return typeof navigator !== "undefined" && !navigator.mediaDevices
    ? "This browser can't use the microphone here (needs https)"
    : `${fallback}. Check that the browser may use your microphone.`;
}

export async function acceptHuddle() {
  const ui = state.ui;
  if (ui.phase !== "incoming" || !ui.callId || !state.engine) return;
  patch({ busy: true });
  bindLocalView(state.engine);
  const { code } = await state.engine.acceptCall({ callId: ui.callId });
  if (code !== 0) {
    await state.engine.endCall({ callId: ui.callId }).catch(() => undefined);
    set({ phase: "ended", peerName: ui.peerName, message: micHint(`Couldn't answer (code ${code})`, code) });
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
