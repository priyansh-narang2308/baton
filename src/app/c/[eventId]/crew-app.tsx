"use client";

import { BellRing, ListTodo, MessageSquare, Plus, Send, Sparkles, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { IncidentCard } from "@/components/incident-card";
import { Button, ConnectionBanner, cx, ErrorNote, inputClass } from "@/components/ui";
import { loadHistory, onMessage, sendGroupText, useNexconn, type ChatMessage } from "@/lib/nexconn-client";
import { api, CATEGORY_LABEL } from "@/lib/types";
import { useEventState } from "@/lib/use-event-state";

type Tab = "stream" | "mine" | "crew";

export function CrewApp({ eventId, role = "member" }: { eventId: string; role?: "member" | "organizer" }) {
  const conn = useNexconn(eventId, role);
  const { state, error, refresh, patchIncident, flash } = useEventState(eventId, conn.state);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nudge, setNudge] = useState<{ number: number; title: string } | null>(null);
  const [tab, setTab] = useState<Tab>("stream");
  const [selected, setSelected] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const bottom = useRef<HTMLDivElement>(null);
  const groupId = state?.event.groupId;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  // History once connected (Web SDK keeps no local store), then live messages for our group.
  useEffect(() => {
    if (conn.state !== "connected" || !groupId) return;
    let cancelled = false;
    loadHistory("group", groupId).then((h) => {
      if (!cancelled) setMessages((cur) => mergeMessages(h, cur));
    });
    return () => {
      cancelled = true;
    };
  }, [conn.state, groupId]);

  useEffect(() => {
    return onMessage((m) => {
      if (m.channelId !== groupId) return;
      if (m.messageType === "BTN:Nudge") {
        const c = m.content as { number: number; title: string };
        setNudge({ number: c.number, title: c.title });
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(200);
      }
      setMessages((cur) => mergeMessages(cur, [m]));
    });
  }, [groupId]);

  useEffect(() => {
    if (tab === "stream") bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, tab]);

  const incidentsById = useMemo(() => new Map(state?.incidents.map((i) => [i.id, i]) ?? []), [state]);
  // Chat-detected requests live on the crew message itself (cardMessageId = that message).
  const incidentsByMessage = useMemo(() => new Map(state?.incidents.filter((i) => i.origin === "chat" && i.cardMessageId).map((i) => [i.cardMessageId!, i]) ?? []), [state]);
  const nameByUser = useMemo(() => new Map(state?.crew.map((c) => [c.nexconnUserId, c.name]) ?? []), [state]);
  const isLead = state?.me?.role === "lead";
  // Requests whose card isn't in the loaded history (joined mid-event, or history beyond the first page).
  const earlier = useMemo(() => {
    const loaded = new Set(messages.map((m) => m.messageId));
    return state?.incidents.filter((i) => (i.status === "open" || i.status === "claimed") && !(i.cardMessageId && loaded.has(i.cardMessageId))) ?? [];
  }, [state, messages]);

  if (error?.code === "forbidden") {
    return (
      <Centered>
        <h1 className="text-lg font-semibold">You&apos;re not on this crew yet</h1>
        <p className="text-sm text-text-2">Scan the crew QR code from your organizer to join.</p>
      </Centered>
    );
  }

  const mine = state?.incidents.filter((i) => i.ownerMemberId === state.me?.id && i.status === "claimed") ?? [];
  const openCount = state?.incidents.filter((i) => i.status === "open").length ?? 0;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-xl flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{state?.event.name ?? "Loading…"}</p>
          <p className="text-xs text-text-3">
            {state?.me ? `${state.me.name} · ${state.me.role === "lead" ? "Lead" : "Crew"}` : " "} {openCount > 0 && <span className="text-open">· {openCount} open</span>}
          </p>
        </div>
        {state?.event.isDemo && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">Demo</span>}
      </header>
      <ConnectionBanner state={conn.state} error={conn.error} onRetry={conn.retry} />
      {nudge && (
        <div role="alert" className="flex items-center gap-2 bg-urgent-soft px-4 py-2.5 text-[13px] text-urgent">
          <BellRing className="size-4" aria-hidden />
          <span className="flex-1">
            <strong>#{nudge.number}</strong> is unclaimed — {nudge.title}. You were asked to handle it.
          </span>
          <button aria-label="Dismiss" onClick={() => setNudge(null)}>
            <X className="size-4" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-3 py-3">
        {!state && !error && <p className="p-6 text-center text-sm text-text-3">Loading the crew stream…</p>}
        {error && error.code !== "forbidden" && <ErrorNote>{error.message}</ErrorNote>}
        {state && tab === "stream" && (
          <ol className="space-y-2.5" aria-label="Crew stream">
            {earlier.length > 0 && (
              <li>
                <section aria-label="Earlier requests" className="space-y-2.5">
                  <h2 className="px-1 text-xs font-medium text-text-3">Earlier requests still open</h2>
                  {earlier.map((inc) => (
                    <IncidentCard key={inc.id} eventId={eventId} incident={inc} meId={state.me?.id ?? null} isLead={isLead} now={now} flashAt={flash[inc.id]} onPatch={patchIncident} onRefresh={refresh} />
                  ))}
                </section>
              </li>
            )}
            {messages.length === 0 && earlier.length === 0 && conn.state === "connected" && (
              <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-3">
                No messages yet. Requests from attendees and crew show up here as cards.
              </li>
            )}
            {messages.map((m) => {
              if (m.messageType === "BTN:Incident") {
                const inc = incidentsById.get(String(m.content.incidentId));
                if (!inc) return null;
                return (
                  <li key={m.messageId}>
                    <IncidentCard eventId={eventId} incident={inc} meId={state.me?.id ?? null} isLead={isLead} now={now} flashAt={flash[inc.id]} onPatch={patchIncident} onRefresh={refresh} />
                  </li>
                );
              }
              if (m.messageType === "BTN:Nudge") return null; // shown as the alert banner
              if (m.messageType !== "RC:TxtMsg") return null;
              const own = m.senderUserId === state.me?.nexconnUserId;
              const text = String((m.content as { text?: string; content?: string }).text ?? (m.content as { content?: string }).content ?? "");
              const inc = incidentsByMessage.get(m.messageId) ?? (m.metadata.inc ? incidentsById.get(m.metadata.inc) : undefined);
              const fromCrew = nameByUser.has(m.senderUserId);
              return (
                <li key={m.messageId} className={cx("flex flex-col", own ? "items-end" : "items-start")}>
                  <button
                    type="button"
                    onClick={() => setSelected((cur) => (cur === m.messageId ? null : m.messageId))}
                    aria-expanded={!inc && fromCrew ? selected === m.messageId : undefined}
                    className={cx("max-w-[80%] rounded-2xl px-3.5 py-2 text-left text-[15px]", own ? "bg-accent text-accent-ink" : "border border-border bg-surface", inc && (own ? "rounded-br-md" : "rounded-bl-md"))}
                  >
                    {!own && <span className="mb-0.5 block text-xs font-medium text-text-3">{nameByUser.get(m.senderUserId) ?? "Crew"}</span>}
                    <span className="block whitespace-pre-wrap break-words">{text}</span>
                  </button>
                  {inc && (
                    <div className="mt-1 w-[88%] max-w-sm">
                      <IncidentCard attached eventId={eventId} incident={inc} meId={state.me?.id ?? null} isLead={isLead} now={now} flashAt={flash[inc.id]} onPatch={patchIncident} onRefresh={refresh} />
                    </div>
                  )}
                  {!inc && fromCrew && selected === m.messageId && (
                    <MakeRequest eventId={eventId} messageId={m.messageId} senderUserId={m.senderUserId} text={text} onDone={() => { setSelected(null); refresh(); }} />
                  )}
                </li>
              );
            })}
            <div ref={bottom} />
          </ol>
        )}
        {state && tab === "mine" && (
          <div className="space-y-2.5">
            {mine.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-3">Nothing claimed yet. Tap “I’ll take it” on a card to own it.</p>
            ) : (
              mine.map((inc) => <IncidentCard key={inc.id} eventId={eventId} incident={inc} meId={state.me?.id ?? null} isLead={isLead} now={now} flashAt={flash[inc.id]} onPatch={patchIncident} onRefresh={refresh} />)
            )}
          </div>
        )}
        {state && tab === "crew" && (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {state.crew.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-sm font-semibold">{c.name.slice(0, 1).toUpperCase()}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {c.name} {c.id === state.me?.id && <span className="text-text-3">(you)</span>}
                  </p>
                  <p className="text-xs text-text-3">
                    {c.role === "lead" ? "Lead" : "Crew"}
                    {c.zoneId ? ` · ${state.zones.find((z) => z.id === c.zoneId)?.name ?? ""}` : ""}
                    {c.isSimulated ? " · simulated" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {state && tab === "stream" && <Composer eventId={eventId} groupId={state.event.groupId} zones={state.zones} connected={conn.state === "connected"} onSent={(m) => setMessages((cur) => mergeMessages(cur, [m]))} onRequested={refresh} />}

      <nav className="grid grid-cols-3 border-t border-border bg-surface" aria-label="Sections">
        {(
          [
            ["stream", MessageSquare, "Stream"],
            ["mine", ListTodo, `My tasks${mine.length ? ` (${mine.length})` : ""}`],
            ["crew", Users, "Crew"],
          ] as const
        ).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)} aria-current={tab === key} className={cx("flex flex-col items-center gap-0.5 py-2 text-[11px]", tab === key ? "text-accent" : "text-text-3")}>
            <Icon className="size-5" aria-hidden />
            {label}
          </button>
        ))}
      </nav>
      {role === "organizer" && (
        <Link href={`/o/${eventId}`} className="fixed right-3 top-3 hidden rounded-md bg-surface px-2 py-1 text-xs text-text-2 shadow-pop sm:block">
          Board
        </Link>
      )}
    </div>
  );
}

function mergeMessages(a: ChatMessage[], b: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  for (const m of [...a, ...b]) byId.set(m.messageId, { ...byId.get(m.messageId), ...m });
  return [...byId.values()].sort((x, y) => x.sentTime - y.sentTime);
}

function Composer({
  eventId,
  groupId,
  zones,
  connected,
  onSent,
  onRequested,
}: {
  eventId: string;
  groupId: string;
  zones: { id: string; name: string }[];
  connected: boolean;
  onSent: (m: ChatMessage) => void;
  onRequested: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [category, setCategory] = useState("supplies");
  const [zoneId, setZoneId] = useState<string>("");
  const [urgent, setUrgent] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      onSent(await sendGroupText(groupId, text.trim()));
      setText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function request() {
    setSending(true);
    setError(null);
    try {
      await api(`/api/events/${eventId}/reports`, { method: "POST", body: JSON.stringify({ category, zoneId: zoneId || null, text: text.trim(), urgent }) });
      setText("");
      setSheet(false);
      onRequested();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-border bg-surface px-3 py-2.5">
      {error && <p role="alert" className="mb-2 text-[13px] text-danger">{error}</p>}
      {sheet && (
        <div className="mb-3 space-y-3 rounded-xl border border-border bg-surface-2 p-3">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
            {Object.entries(CATEGORY_LABEL).map(([k, label]) => (
              <button key={k} role="radio" aria-checked={category === k} onClick={() => setCategory(k)} className={cx("rounded-full border px-3 py-1 text-[13px]", category === k ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text-2")}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select aria-label="Location" className={cx(inputClass, "h-10 flex-1 text-sm")} value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              <option value="">Location (optional)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[13px] text-text-2">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> Urgent
            </label>
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Button variant={sheet ? "primary" : "secondary"} size="md" aria-label={sheet ? "Close request form" : "Create a request"} onClick={() => setSheet((s) => !s)} className="w-10 px-0">
          {sheet ? <X className="size-4" /> : <Plus className="size-4" />}
        </Button>
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (sheet) void request();
              else void send();
            }
          }}
          placeholder={sheet ? "What's needed? (optional)" : connected ? "Message the crew" : "Connecting…"}
          aria-label={sheet ? "Request details" : "Message"}
          className={cx(inputClass, "min-h-10 resize-none py-2 text-[15px]")}
        />
        <Button variant="primary" busy={sending} disabled={!connected && !sheet} aria-label={sheet ? "Post request" : "Send"} onClick={sheet ? request : send} className={sheet ? "" : "w-10 px-0"}>
          {sheet ? "Post" : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

/** Fallback when detection missed a request: the same chat message becomes claimable in place. */
function MakeRequest({ eventId, messageId, senderUserId, text, onDone }: { eventId: string; messageId: string; senderUserId: string; text: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function make() {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/events/${eventId}/chat-requests`, { method: "POST", body: JSON.stringify({ messageId, senderUserId, text }) });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-1 flex items-center gap-2">
      <Button size="sm" variant="secondary" busy={busy} onClick={make}>
        <Sparkles className="size-3.5" aria-hidden /> Make it a request
      </Button>
      {error && <span role="alert" className="text-[13px] text-danger">{error}</span>}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-2 p-6 text-center">{children}</div>;
}
