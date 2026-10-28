"use client";

import { BarChart3, Copy, QrCode, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IncidentCard } from "@/components/incident-card";
import { ConnectionBanner, cx, ErrorNote, useOrigin } from "@/components/ui";
import { useNexconn } from "@/lib/nexconn-client";
import type { IncidentView } from "@/lib/types";
import { useEventState } from "@/lib/use-event-state";

const COLUMNS: { key: IncidentView["status"]; title: string; empty: string }[] = [
  { key: "open", title: "Needs an owner", empty: "Nothing waiting. New reports land here." },
  { key: "claimed", title: "Being handled", empty: "No one is on anything right now." },
  { key: "resolved", title: "Fixed", empty: "Fixed issues collect here." },
];

export function Board({ eventId, crewCode, slug }: { eventId: string; crewCode: string; slug: string }) {
  const conn = useNexconn(eventId, "organizer");
  const { state, error, refresh, patchIncident, flash } = useEventState(eventId, conn.state);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);

  const byStatus = useMemo(() => {
    const m: Record<string, IncidentView[]> = { open: [], claimed: [], resolved: [] };
    for (const i of state?.incidents ?? []) m[i.status]?.push(i);
    m.open.sort((a, b) => (a.priority === b.priority ? a.createdAt - b.createdAt : a.priority === "urgent" ? -1 : 1));
    return m;
  }, [state]);

  const stats = useMemo(() => {
    const inc = state?.incidents ?? [];
    const claimTimes = inc.filter((i) => i.claimedAt).map((i) => i.claimedAt! - i.createdAt).sort((a, b) => a - b);
    const median = claimTimes.length ? claimTimes[Math.floor(claimTimes.length / 2)] : null;
    const reports = inc.reduce((n, i) => n + i.reportCount, 0);
    return { reports, incidents: inc.length, absorbed: Math.max(0, reports - inc.length), median };
  }, [state]);

  if (error?.code === "forbidden") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 p-6 text-center">
        <h1 className="text-lg font-semibold">Open your organizer link</h1>
        <p className="text-sm text-text-2">This board is private. Use the organizer link you got when you created the event.</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-accent">Baton · Operations{state?.event.isDemo && " · Demo"}</p>
          <h1 className="truncate text-lg font-semibold tracking-tight">{state?.event.name ?? "Loading…"}</h1>
        </div>
        <dl className="hidden gap-6 text-right md:flex" aria-label="Live metrics">
          <Metric label="Reports" value={stats.reports} />
          <Metric label="Duplicates merged" value={stats.absorbed} />
          <Metric label="Median time to claim" value={stats.median === null ? "—" : `${Math.round(stats.median / 1000)}s`} />
        </dl>
        <Link href={`/o/${eventId}/report`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-surface-2">
          <BarChart3 className="size-4" aria-hidden /> Impact
        </Link>
        <Link href={`/o/${eventId}/share`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-surface-2">
          <QrCode className="size-4" aria-hidden /> QR codes
        </Link>
      </header>
      <ConnectionBanner state={conn.state} error={conn.error} onRetry={conn.retry} />
      {error && error.code !== "forbidden" && (
        <div className="p-4">
          <ErrorNote>{error.message}</ErrorNote>
        </div>
      )}
      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[1fr_1fr_1fr_280px]">
        {COLUMNS.map((col) => (
          <section key={col.key} aria-labelledby={`col-${col.key}`} className="min-w-0">
            <h2 id={`col-${col.key}`} className="mb-2 flex items-center gap-2 px-1 text-[13px] font-semibold text-text-2">
              <span className={cx("size-2 rounded-full", col.key === "open" ? "bg-open" : col.key === "claimed" ? "bg-claimed" : "bg-done")} />
              {col.title}
              <span className="font-normal text-text-3">{byStatus[col.key]?.length ?? 0}</span>
            </h2>
            <div className="space-y-2.5">
              {(byStatus[col.key] ?? []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-center text-[13px] text-text-3">{col.empty}</p>
              ) : (
                byStatus[col.key].map((i) => (
                  <IncidentCard key={i.id} eventId={eventId} incident={i} meId={state?.me?.id ?? null} isLead now={now} flashAt={flash[i.id]} compact={col.key === "resolved"} onPatch={patchIncident} onRefresh={refresh} />
                ))
              )}
            </div>
          </section>
        ))}
        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-text-2">
              <Users className="size-4" aria-hidden /> Crew <span className="font-normal text-text-3">{state?.crew.length ?? 0}</span>
            </h2>
            <ul className="mt-3 space-y-2">
              {state?.crew.map((c) => {
                const load = state.incidents.filter((i) => i.ownerMemberId === c.id && i.status === "claimed").length;
                return (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="grid size-6 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold">{c.name.slice(0, 1).toUpperCase()}</span>
                    <span className="flex-1 truncate">
                      {c.name}
                      {c.isSimulated && <span className="text-text-3"> · sim</span>}
                    </span>
                    {c.role === "lead" && <span className="text-[11px] text-text-3">lead</span>}
                    {load > 0 && <span className="rounded bg-claimed-soft px-1.5 text-[11px] text-claimed">{load}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-surface p-4 text-sm">
            <h2 className="text-[13px] font-semibold text-text-2">Invite the crew</h2>
            <CopyLine path={`/join/${crewCode}`} />
            <h2 className="mt-3 text-[13px] font-semibold text-text-2">Attendee help page</h2>
            <CopyLine path={`/e/${slug}`} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-text-3">{label}</dt>
      <dd className="font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function CopyLine({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${useOrigin()}${path}`;
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="mt-1.5 flex w-full items-center gap-2 rounded-md bg-surface-2 px-2 py-1.5 text-left font-mono text-xs text-text-2 hover:text-text"
    >
      <span className="flex-1 truncate">{url}</span>
      {copied ? "Copied" : <Copy className="size-3.5" aria-hidden />}
    </button>
  );
}
