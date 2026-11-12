"use client";

import { ArrowLeft, ArrowRightLeft, ChevronRight, MessageCircle, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, CATEGORY_LABEL, type CrewMemberView, type EventState, type IncidentView } from "@/lib/types";
import { DirectThread } from "./direct-thread";
import { IncidentCard } from "./incident-card";
import { Sheet } from "./sheet";
import { Button, cx, ErrorNote, inputClass } from "./ui";

type ActivityEntry = { id: string; type: string; at: number; actorName: string; actorKind: "crew" | "attendee" | "system"; detail: Record<string, unknown> };
type ReportEntry = { id: string; source: "attendee" | "crew"; reporterName: string; simulated: boolean; text: string; zoneName: string | null; category: string; attachedBy: "new" | "auto" | "merge"; fromChat: boolean; createdAt: number };
type Detail = {
  incident: { id: string; number: number; status: string; ownerName: string | null; escalationLevel: number; timeToClaimSec: number | null; timeToFixSec: number | null };
  reports: ReportEntry[];
  activity: ActivityEntry[];
};

type Props = {
  eventId: string;
  incident: IncidentView;
  crew: CrewMemberView[];
  me: EventState["me"];
  isLead: boolean;
  as?: "organizer";
  now: number;
  connected: boolean;
  flashAt?: number;
  onPatch: (id: string, patch: Partial<IncidentView>) => void;
  onRefresh: () => void;
  onClose: () => void;
};

/** Everything about one incident in one place: live state and actions, assignment, the owner thread, every report, full history. */
export function IncidentDetail({ eventId, incident: i, crew, me, isLead, as, now, connected, flashAt, onPatch, onRefresh, onClose }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<CrewMemberView | null>(null);
  const q = as ? `?as=${as}` : "";

  // Re-read whenever the incident moves (its version bumps on every state change, local or from another device).
  useEffect(() => {
    let cancelled = false;
    api<Detail>(`/api/events/${eventId}/incidents/${i.id}${q}`)
      .then((d) => !cancelled && (setDetail(d), setError(null)))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [eventId, i.id, i.version, i.reportCount, q]);

  const owner = crew.find((c) => c.id === i.ownerMemberId) ?? null;
  const canMessageOwner = owner && owner.id !== me?.id && !owner.isSimulated;
  const canPass = i.status === "claimed" && !!me && i.ownerMemberId === me.id && !i.passToMemberId;
  const noop = useCallback(() => {}, []);

  if (thread) {
    return (
      <Sheet
        onClose={onClose}
        title={
          <span className="flex items-center gap-2">
            <button onClick={() => setThread(null)} aria-label="Back to incident" className="grid size-7 place-items-center rounded-md text-text-2 hover:bg-surface-2">
              <ArrowLeft className="size-4" />
            </button>
            <span className="truncate">
              {thread.name} <span className="font-normal text-text-3">· about #{i.number}</span>
            </span>
          </span>
        }
      >
        <div className="flex h-full min-h-[60dvh] flex-col lg:min-h-full">
          <DirectThread peerUserId={thread.nexconnUserId} peerName={thread.name} meUserId={me?.nexconnUserId ?? null} connected={connected} draft={`Re #${i.number} ${i.title}: `} onActivity={noop} />
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} title={<span className="font-serif text-[26px] font-normal leading-none tracking-[-0.02em]">Incident <span className="text-text-3">#{i.number}</span></span>}>
      <div className="space-y-5 p-4">
        <IncidentCard eventId={eventId} incident={i} meId={me?.id ?? null} isLead={isLead} now={now} flashAt={flashAt} as={as} onPatch={onPatch} onRefresh={onRefresh} />

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-4">
          <Fact label="Reported" value={clock(i.createdAt)} />
          <Fact label="Category" value={CATEGORY_LABEL[i.category] ?? i.category} />
          <Fact label="Time to owner" value={dur(detail?.incident.timeToClaimSec ?? null) ?? (i.status === "open" ? `waiting ${dur(Math.round((now - i.createdAt) / 1000))}` : "—")} />
          <Fact label="Time to fix" value={dur(detail?.incident.timeToFixSec ?? null) ?? "—"} />
        </dl>

        {(isLead || canMessageOwner || canPass) && i.status !== "withdrawn" && (
          <section className="space-y-2" aria-label="Coordinate">
            {canPass && <PassBaton eventId={eventId} incident={i} crew={crew} meId={me!.id} q={q} onPatch={onPatch} onRefresh={onRefresh} />}
            {isLead && i.status !== "resolved" && <Assign eventId={eventId} incident={i} crew={crew} q={q} onPatch={onPatch} onRefresh={onRefresh} />}
            {canMessageOwner && (
              <button onClick={() => setThread(owner)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm hover:bg-surface-2">
                <MessageCircle className="size-4 text-accent" aria-hidden />
                <span className="flex-1">
                  Message <strong className="font-medium">{owner.name}</strong>
                  <span className="block text-xs text-text-3">Private Nexconn conversation, only the two of you see it</span>
                </span>
                <ChevronRight className="size-4 text-text-3" aria-hidden />
              </button>
            )}
          </section>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}

        <section aria-labelledby="reports-h">
          <h3 id="reports-h" className="mb-2 text-[13px] font-semibold text-text-2">
            Reports <span className="font-normal text-text-3">{detail?.reports.length ?? i.reportCount}</span>
          </h3>
          {!detail && !error && <Skeleton rows={2} />}
          <ul className="space-y-2">
            {detail?.reports.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-surface px-3 py-2.5">
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-text-3">
                  <span className="font-medium text-text-2">{r.reporterName}</span>
                  <span>{r.source === "crew" ? (r.fromChat ? "crew chat" : "crew") : "attendee QR"}</span>
                  {r.zoneName && <span>· {r.zoneName}</span>}
                  <span>· {clock(r.createdAt)}</span>
                  {r.attachedBy !== "new" && <span className="rounded bg-surface-2 px-1.5 text-[11px]">{r.attachedBy === "auto" ? "merged automatically" : "merged by crew"}</span>}
                  {r.simulated && <span className="rounded bg-surface-2 px-1.5 text-[11px]">simulated</span>}
                </p>
                <p className={cx("mt-1 text-[15px]", !r.text && "text-text-3")}>{r.text || `${CATEGORY_LABEL[r.category] ?? r.category} (no details given)`}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="activity-h">
          <h3 id="activity-h" className="mb-2 text-[13px] font-semibold text-text-2">
            Activity
          </h3>
          {!detail && !error && <Skeleton rows={3} />}
          <ol className="relative space-y-3 border-l border-border pl-4">
            {detail?.activity.map((e) => (
              <li key={e.id} className="relative">
                <span className={cx("absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-bg", DOT[e.type] ?? "bg-text-3")} aria-hidden />
                <p className="text-sm">{describe(e)}</p>
                <p className="text-xs text-text-3">{clock(e.at)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Sheet>
  );
}

/**
 * Baton Pass: the owner hands the incident to a teammate who must accept it. Until they do, the owner keeps it, so
 * a shift change or a volunteer stepping away never leaves an incident with nobody on it.
 */
function PassBaton({ eventId, incident: i, crew, meId, q, onPatch, onRefresh }: { eventId: string; incident: IncidentView; crew: CrewMemberView[]; meId: string; q: string; onPatch: Props["onPatch"]; onRefresh: () => void }) {
  const [memberId, setMemberId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Simulated crew can't answer, and a pass nobody can accept would only sit there.
  const options = crew.filter((c) => c.id !== meId && !c.isSimulated);

  async function pass() {
    const m = options.find((c) => c.id === memberId);
    if (!m) return;
    setBusy(true);
    setError(null);
    onPatch(i.id, { passToMemberId: m.id, passToName: m.name, passNote: note.trim() || null });
    try {
      await api(`/api/events/${eventId}/incidents/${i.id}/pass${q}`, { method: "POST", body: JSON.stringify({ memberId: m.id, note }) });
      setMemberId("");
      setNote("");
    } catch (e) {
      onPatch(i.id, { passToMemberId: null, passToName: null, passNote: null, passOfferedAt: null });
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onRefresh();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <label htmlFor={`pass-${i.id}`} className="flex items-center gap-2 text-[13px] font-medium text-text-2">
        <ArrowRightLeft className="size-4" aria-hidden /> Pass the baton
      </label>
      {options.length === 0 ? (
        <p className="mt-1.5 text-[13px] text-text-3">No teammate who can take it yet. Share the crew QR code so someone can join.</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-text-3">It stays yours until they accept. They get a private alert in the crew chat.</p>
          <div className="mt-2 flex gap-2">
            <select id={`pass-${i.id}`} value={memberId} onChange={(e) => setMemberId(e.target.value)} className={cx(inputClass, "h-10 flex-1 text-sm")}>
              <option value="">Choose a teammate</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.role === "lead" ? " (lead)" : ""}
                </option>
              ))}
            </select>
            <Button variant="primary" busy={busy} disabled={!memberId} onClick={pass}>
              Pass
            </Button>
          </div>
          <input
            value={note}
            maxLength={280}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Handover note: what's done, what's left (optional)"
            aria-label="Handover note"
            className={cx(inputClass, "mt-2 h-10 w-full text-sm")}
          />
        </>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Assign({ eventId, incident: i, crew, q, onPatch, onRefresh }: { eventId: string; incident: IncidentView; crew: CrewMemberView[]; q: string; onPatch: Props["onPatch"]; onRefresh: () => void }) {
  const [memberId, setMemberId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const options = crew.filter((c) => c.id !== i.ownerMemberId);

  async function assign() {
    const m = crew.find((c) => c.id === memberId);
    if (!m) return;
    setBusy(true);
    setMsg(null);
    const before = { status: i.status, ownerMemberId: i.ownerMemberId, ownerName: i.ownerName };
    onPatch(i.id, { status: "claimed", ownerMemberId: m.id, ownerName: m.name });
    try {
      await api(`/api/events/${eventId}/incidents/${i.id}/assign${q}`, { method: "POST", body: JSON.stringify({ memberId: m.id }) });
      setMsg({ ok: true, text: m.isSimulated ? `Assigned to ${m.name}.` : `Assigned. ${m.name} got a private alert in the crew chat.` });
      setMemberId("");
    } catch (e) {
      onPatch(i.id, before);
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
      onRefresh();
    }
  }

  if (options.length === 0) return <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-[13px] text-text-3">No one else on the crew yet. Share the crew QR code to add volunteers.</p>;
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <label htmlFor={`assign-${i.id}`} className="flex items-center gap-2 text-[13px] font-medium text-text-2">
        <UserPlus className="size-4" aria-hidden /> {i.ownerMemberId ? "Reassign" : "Assign to"}
      </label>
      <div className="mt-2 flex gap-2">
        <select id={`assign-${i.id}`} value={memberId} onChange={(e) => setMemberId(e.target.value)} className={cx(inputClass, "h-10 flex-1 text-sm")}>
          <option value="">Choose a crew member</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.role === "lead" ? " (lead)" : ""}
              {c.isSimulated ? " (simulated)" : ""}
            </option>
          ))}
        </select>
        <Button variant="primary" busy={busy} disabled={!memberId} onClick={assign}>
          Assign
        </Button>
      </div>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cx("mt-2 text-[13px]", msg.ok ? "text-done" : "text-danger")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

const DOT: Record<string, string> = {
  "incident.created": "bg-open",
  "report.attached": "bg-open",
  "incident.claimed": "bg-claimed",
  "incident.assigned": "bg-claimed",
  "incident.resolved": "bg-done",
  "incident.escalated": "bg-urgent",
  "pass.offered": "bg-claimed",
  "pass.accepted": "bg-claimed",
};

function describe(e: ActivityEntry): string {
  const d = e.detail;
  const who = e.actorName;
  switch (e.type) {
    case "incident.created":
      return d.mode === "auto" ? `Baton spotted a request in ${who}'s chat message` : d.mode === "manual" ? `A crew chat message from ${who} was turned into a request` : `${who} reported it${d.priority === "urgent" ? " (urgent)" : ""}`;
    case "report.attached":
      return `${who} reported the same issue — merged into this card`;
    case "merge.suggested":
      return `Baton flagged a possible duplicate of #${d.candidateIncidentNumber ?? "?"}`;
    case "merge.dismissed":
      return `${who} kept it separate`;
    case "incident.merged_into":
      return `${who} merged it into #${d.targetNumber ?? "?"}`;
    case "incident.merged_from":
      return `${who} merged #${d.sourceNumber ?? "?"} into this`;
    case "incident.claimed":
      return `${who} took ownership`;
    case "incident.assigned":
      return d.previousOwnerName ? `${who} reassigned it from ${d.previousOwnerName} to ${d.assigneeName ?? "someone"}` : `${who} assigned it to ${d.assigneeName ?? "someone"}`;
    case "incident.released":
      return `${who} released it — back to "needs an owner"`;
    case "incident.resolved":
      return `${who} marked it fixed`;
    case "incident.escalated":
      return d.level === 1 ? "Still unowned — Baton alerted the zone lead" : "Still unowned — Baton alerted the event leads";
    case "pass.offered":
      return `${who} offered the baton to ${d.toName ?? "a teammate"}${d.note ? ` — “${d.note}”` : ""}`;
    case "pass.accepted":
      return `${who} took the baton from ${d.fromName ?? "the previous owner"}`;
    case "pass.declined":
      return `${who} couldn't take it — it stayed with the owner`;
    case "pass.cancelled":
      return `${who} withdrew the pass to ${d.toName ?? "a teammate"}`;
    case "detection.dismissed":
      return `${who} marked it as not a request`;
    case "report.split_out":
      return `${who} split a report out into #${d.newIncidentNumber ?? "?"}`;
    case "incident.created_from_split":
      return `${who} split this out of #${d.fromIncidentNumber ?? "?"}`;
    default:
      return `${who}: ${e.type}`;
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-text-3">{label}</dt>
      <dd className="mt-0.5 truncate font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }, (_, k) => (
        <div key={k} className="h-12 animate-pulse rounded-xl bg-surface-2" />
      ))}
    </div>
  );
}

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function dur(sec: number | null): string | null {
  if (sec === null) return null;
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m}m ${sec % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
