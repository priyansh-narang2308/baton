"use client";

import { AlertTriangle, Check, GitMerge, MapPin, Sparkles, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, CATEGORY_LABEL, type IncidentView } from "@/lib/types";
import { Button, cx, timeAgo } from "./ui";

type Props = {
  eventId: string;
  incident: IncidentView;
  meId: string | null;
  isLead: boolean;
  now: number;
  flashAt?: number;
  compact?: boolean;
  /** Rendered directly under the crew chat message it was detected from: the message is the title. */
  attached?: boolean;
  onPatch: (id: string, patch: Partial<IncidentView>) => void;
  onRefresh: () => void;
};

const STATUS_STYLE = {
  open: { edge: "border-l-open", pill: "bg-open-soft text-open", label: "Open" },
  claimed: { edge: "border-l-claimed", pill: "bg-claimed-soft text-claimed", label: "On it" },
  resolved: { edge: "border-l-done", pill: "bg-done-soft text-done", label: "Fixed" },
  withdrawn: { edge: "border-l-border", pill: "bg-surface-2 text-text-3", label: "Merged" },
} as const;

/** The incident card — the same component in the crew stream and on the organizer board. */
export function IncidentCard({ eventId, incident: i, meId, isLead, now, flashAt, compact, attached, onPatch, onRefresh }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  const prevStatus = useRef(i.status);
  const prevCount = useRef(i.reportCount);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (prevStatus.current !== i.status && i.status === "claimed") {
      setAnim(true);
      const t = setTimeout(() => setAnim(false), 750);
      prevStatus.current = i.status;
      return () => clearTimeout(t);
    }
    prevStatus.current = i.status;
  }, [i.status, flashAt]);

  useEffect(() => {
    if (i.reportCount > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 450);
      prevCount.current = i.reportCount;
      return () => clearTimeout(t);
    }
    prevCount.current = i.reportCount;
  }, [i.reportCount]);

  async function act(action: string, optimistic?: Partial<IncidentView>, payload?: unknown) {
    setBusy(action);
    setError(null);
    const before = { ...i };
    if (optimistic) onPatch(i.id, optimistic);
    try {
      await api(`/api/events/${eventId}/incidents/${i.id}/${action}`, { method: "POST", body: payload ? JSON.stringify(payload) : undefined });
      onRefresh();
    } catch (e) {
      const err = e as Error & { code?: string; details?: { ownerName?: string } };
      onPatch(i.id, before); // roll back the optimistic change
      setError(err.code === "conflict" && err.details?.ownerName ? `${err.details.ownerName} got it first.` : err.message);
      onRefresh();
    } finally {
      setBusy(null);
    }
  }

  const s = STATUS_STYLE[i.status];
  const mine = i.ownerMemberId && i.ownerMemberId === meId;
  const urgent = i.priority === "urgent" && i.status === "open";

  return (
    <article
      aria-label={`Incident ${i.number}: ${i.title}, ${s.label}${i.ownerName ? ` — ${i.ownerName}` : ""}`}
      className={cx(
        "rounded-xl border border-border border-l-4 bg-surface transition-colors",
        attached ? "px-3 py-2.5" : "p-4",
        s.edge,
        urgent && "bg-urgent-soft",
        anim && "anim-claim",
        i.status === "resolved" && compact && "py-2.5",
      )}
    >
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-3">
            <span className="font-mono">#{i.number}</span>
            <span>{CATEGORY_LABEL[i.category] ?? i.category}</span>
            {i.zoneName && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" aria-hidden />
                {i.zoneName}
              </span>
            )}
            <span>· {timeAgo(i.createdAt, now)} ago</span>
            {i.origin === "chat" && (
              <span className="inline-flex items-center gap-1 text-accent" title="Raised from a crew chat message">
                <Sparkles className="size-3" aria-hidden /> From chat
              </span>
            )}
            {urgent && (
              <span className="inline-flex items-center gap-1 font-medium text-urgent">
                <AlertTriangle className="size-3" aria-hidden /> Urgent
              </span>
            )}
          </div>
          <h3 className={cx(attached && "sr-only", "mt-1 text-[15px] font-semibold leading-snug text-text", i.status === "resolved" && "text-text-2 line-through decoration-text-3/40")}>{i.title}</h3>
        </div>
        <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", s.pill)}>{s.label}</span>
      </header>

      <div className={cx(attached ? "mt-2" : "mt-3", "flex flex-wrap items-center gap-2")}>
        <span className={cx("inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs text-text-2", bump && "anim-bump")} title="People who reported this">
          <Users className="size-3.5" aria-hidden />
          {i.reportCount} {i.reportCount === 1 ? "report" : "reports"}
        </span>
        {i.ownerName && i.status !== "withdrawn" && (
          <span key={i.ownerName} className="anim-owner inline-flex items-center gap-1.5 text-[13px] text-text">
            <span className="grid size-5 place-items-center rounded-full bg-claimed text-[10px] font-semibold text-white">{i.ownerName.slice(0, 1).toUpperCase()}</span>
            {mine ? "You" : i.ownerName}
            {i.claimedAt && i.status === "claimed" && <span className="text-text-3">· {timeAgo(i.claimedAt, now)}</span>}
          </span>
        )}
        {i.escalationLevel > 0 && i.status === "open" && <span className="text-xs text-urgent">Lead notified</span>}
      </div>

      {i.suggestion && i.status !== "withdrawn" && i.status !== "resolved" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border-strong px-3 py-2 text-[13px]">
          <GitMerge className="size-4 text-accent" aria-hidden />
          <span className="flex-1 text-text-2">
            Looks like the same issue as <span className="font-medium text-text">#{i.suggestion.candidateNumber}</span>
          </span>
          <Button size="sm" variant="primary" busy={busy === "merge"} onClick={() => act("merge", undefined, { targetIncidentId: i.suggestion!.candidateIncidentId })}>
            Merge
          </Button>
          <Button size="sm" variant="ghost" busy={busy === "dismiss-suggestion"} onClick={() => act("dismiss-suggestion", { suggestion: null })}>
            Keep separate
          </Button>
        </div>
      )}

      {i.status !== "withdrawn" && i.status !== "resolved" && (
        <div className="mt-3 flex gap-2">
          {i.status === "open" && (
            <Button variant="claim" size={compact || attached ? "sm" : "md"} className="flex-1" busy={busy === "claim"} onClick={() => act("claim")}>
              I&apos;ll take it
            </Button>
          )}
          {i.status === "open" && i.origin === "chat" && i.reportCount === 1 && (
            <Button variant="ghost" size="sm" busy={busy === "dismiss-detection"} onClick={() => act("dismiss-detection", { status: "withdrawn" })}>
              Not a request
            </Button>
          )}
          {i.status === "claimed" && (mine || isLead) && (
            <>
              <Button variant="done" size={compact ? "sm" : "md"} className="flex-1" busy={busy === "resolve"} onClick={() => act("resolve", { status: "resolved" })}>
                <Check className="size-4" aria-hidden /> Mark fixed
              </Button>
              <Button variant="ghost" size={compact ? "sm" : "md"} busy={busy === "release"} onClick={() => act("release", { status: "open", ownerMemberId: null, ownerName: null })}>
                Release
              </Button>
            </>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </article>
  );
}
