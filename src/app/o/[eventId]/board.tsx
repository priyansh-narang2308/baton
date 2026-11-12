"use client";

import { BarChart3, Copy, ExternalLink, MessageCircle, QrCode, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DirectThread } from "@/components/direct-thread";
import { Inbox, useDirectThreads } from "@/components/inbox";
import { IncidentCard } from "@/components/incident-card";
import { IncidentDetail } from "@/components/incident-detail";
import { Sheet } from "@/components/sheet";
import { ConnectionBanner, cx, ErrorNote, timeAgo, useOrigin } from "@/components/ui";
import { useNexconn } from "@/lib/nexconn-client";
import { CATEGORY_LABEL, type CrewMemberView, type IncidentView } from "@/lib/types";
import { useEventState } from "@/lib/use-event-state";

const COLUMNS: { key: IncidentView["status"]; title: string; empty: string; filteredEmpty: string }[] = [
  { key: "open", title: "Needs an owner", empty: "Nothing waiting. New reports land here.", filteredEmpty: "Nothing waiting that matches the filters." },
  { key: "claimed", title: "Being handled", empty: "No one is on anything right now.", filteredEmpty: "Nothing in progress that matches." },
  { key: "resolved", title: "Fixed", empty: "Fixed issues collect here.", filteredEmpty: "Nothing fixed that matches." },
];

export function Board({ eventId, crewCode, slug }: { eventId: string; crewCode: string; slug: string }) {
  const conn = useNexconn(eventId, "organizer");
  const { state, error, refresh, patchIncident, flash } = useEventState(eventId, conn.state, "organizer");
  const connected = conn.state === "connected";
  const dms = useDirectThreads(connected, state?.crew, state?.me?.nexconnUserId);
  const [now, setNow] = useState(() => Date.now());
  const [openId, setOpenId] = useState<string | null>(null);
  const [dmPeer, setDmPeer] = useState<CrewMemberView | null>(null);
  const [zone, setZone] = useState("");
  const [category, setCategory] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);

  const incidents = useMemo(() => state?.incidents ?? [], [state]);
  const filtered = useMemo(
    () => incidents.filter((i) => (!zone || i.zoneId === zone) && (!category || i.category === category) && (!urgentOnly || i.priority === "urgent")),
    [incidents, zone, category, urgentOnly],
  );
  const byStatus = useMemo(() => {
    const m: Record<string, IncidentView[]> = { open: [], claimed: [], resolved: [] };
    for (const i of filtered) m[i.status]?.push(i);
    // Urgent first, then whoever has waited longest.
    m.open.sort((a, b) => (a.priority === b.priority ? a.createdAt - b.createdAt : a.priority === "urgent" ? -1 : 1));
    m.claimed.sort((a, b) => (a.claimedAt ?? 0) - (b.claimedAt ?? 0));
    m.resolved.sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
    return m;
  }, [filtered]);

  const kpi = useMemo(() => {
    const open = incidents.filter((i) => i.status === "open");
    const claimTimes = incidents.filter((i) => i.claimedAt).map((i) => i.claimedAt! - i.createdAt).sort((a, b) => a - b);
    const reports = incidents.reduce((n, i) => n + i.reportCount, 0);
    return {
      open: open.length,
      urgent: open.filter((i) => i.priority === "urgent").length,
      oldest: open.length ? Math.min(...open.map((i) => i.createdAt)) : null,
      handling: incidents.filter((i) => i.status === "claimed").length,
      fixed: incidents.filter((i) => i.status === "resolved").length,
      merged: Math.max(0, reports - incidents.length),
      medianClaim: claimTimes.length ? claimTimes[Math.floor((claimTimes.length - 1) / 2)] : null,
    };
  }, [incidents]);

  const filtering = Boolean(zone || category || urgentOnly);
  const categories = useMemo(() => [...new Set(incidents.map((i) => i.category))], [incidents]);
  const others = state?.crew.filter((c) => c.id !== state.me?.id) ?? [];
  const open = openId ? incidents.find((i) => i.id === openId) : undefined;

  if (error?.code === "forbidden") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 p-6 text-center">
        <h1 className="font-serif font-normal tracking-[-0.025em] text-[30px] leading-[1.05]">Open your organizer link</h1>
        <p className="text-sm text-text-2">This command centre is private. Use the organizer link you saved when you created the event.</p>
        <Link href="/" className="mt-2 text-sm text-accent underline-offset-2 hover:underline">
          Back to Baton
        </Link>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-surface px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
            <span className={cx("size-1.5 rounded-full", connected ? "bg-done" : "bg-open")} aria-hidden />
            Command centre{state?.event.isDemo && " · Demo"}
          </p>
          <h1 className="font-serif font-normal tracking-[-0.025em] truncate text-[30px] leading-[1.05]">{state?.event.name ?? "Loading…"}</h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Event">
          <HeaderLink href={`/c/${eventId}`} icon={<ExternalLink className="size-4" aria-hidden />}>
            Crew view
          </HeaderLink>
          <HeaderLink href={`/o/${eventId}/report`} icon={<BarChart3 className="size-4" aria-hidden />}>
            Impact
          </HeaderLink>
          <HeaderLink href={`/o/${eventId}/share`} icon={<QrCode className="size-4" aria-hidden />}>
            QR codes
          </HeaderLink>
        </nav>
      </header>
      <ConnectionBanner state={conn.state} error={conn.error} onRetry={conn.retry} />

      <section aria-label="Live metrics" className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Needs an owner" value={kpi.open} tone={kpi.open > 0 ? "open" : undefined} />
        <Kpi label="Urgent waiting" value={kpi.urgent} tone={kpi.urgent > 0 ? "urgent" : undefined} />
        <Kpi label="Longest wait" value={kpi.oldest ? timeAgo(kpi.oldest, now) : "—"} tone={kpi.oldest && now - kpi.oldest > 5 * 60_000 ? "urgent" : undefined} />
        <Kpi label="Being handled" value={kpi.handling} />
        <Kpi label="Fixed" value={kpi.fixed} />
        <Kpi label="Median time to owner" value={kpi.medianClaim === null ? "—" : timeAgo(0, kpi.medianClaim)} hint={kpi.merged > 0 ? `${kpi.merged} duplicate report${kpi.merged === 1 ? "" : "s"} merged` : undefined} />
      </section>

      {error && error.code !== "forbidden" && (
        <div className="p-4">
          <ErrorNote>{error.message}</ErrorNote>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-5" role="group" aria-label="Filters">
        <select aria-label="Filter by location" value={zone} onChange={(e) => setZone(e.target.value)} className="h-9 rounded-full border border-border bg-surface px-3.5 text-sm">
          <option value="">All locations</option>
          {state?.zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-full border border-border bg-surface px-3.5 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c] ?? c}
            </option>
          ))}
        </select>
        <label className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-sm">
          <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} /> Urgent only
        </label>
        {filtering && (
          <button
            className="h-9 px-2 text-sm text-text-2 underline-offset-2 hover:underline"
            onClick={() => {
              setZone("");
              setCategory("");
              setUrgentOnly(false);
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 sm:px-5 lg:grid-cols-[1fr_1fr_1fr_300px]">
        {!state && !error && (
          <div className="space-y-2.5 lg:col-span-3" aria-hidden>
            {[0, 1, 2].map((k) => (
              <div key={k} className="h-28 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        )}
        {state &&
          COLUMNS.map((col) => (
            <section key={col.key} aria-labelledby={`col-${col.key}`} className="min-w-0">
              <h2 id={`col-${col.key}`} className="mb-2 flex items-center gap-2 px-1 text-[13px] font-semibold text-text-2">
                <span className={cx("size-2 rounded-full", col.key === "open" ? "bg-open" : col.key === "claimed" ? "bg-claimed" : "bg-done")} />
                {col.title}
                <span className="font-normal text-text-3">{byStatus[col.key]?.length ?? 0}</span>
              </h2>
              <div className="space-y-2.5">
                {(byStatus[col.key] ?? []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-5 text-center text-[13px] text-text-3">{filtering ? col.filteredEmpty : col.empty}</p>
                ) : (
                  byStatus[col.key].map((i) => (
                    <IncidentCard
                      key={i.id}
                      as="organizer"
                      eventId={eventId}
                      incident={i}
                      meId={state.me?.id ?? null}
                      isLead
                      now={now}
                      flashAt={flash[i.id]}
                      compact={col.key === "resolved"}
                      onOpen={() => setOpenId(i.id)}
                      onPatch={patchIncident}
                      onRefresh={refresh}
                    />
                  ))
                )}
              </div>
            </section>
          ))}

        <aside className="min-w-0 space-y-4">
          <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="crew-h">
            <h2 id="crew-h" className="flex items-center gap-2 text-[13px] font-semibold text-text-2">
              <Users className="size-4" aria-hidden /> Crew <span className="font-normal text-text-3">{others.length}</span>
            </h2>
            {others.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-3">No volunteers yet. Share the crew link below; they join by name, without an account.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {others.map((c) => {
                  const load = incidents.filter((i) => i.ownerMemberId === c.id && i.status === "claimed").length;
                  return (
                    <li key={c.id} className="flex items-center gap-2 text-sm">
                      <span className="grid size-6 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold">{c.name.slice(0, 1).toUpperCase()}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {c.name}
                        {c.isSimulated && <span className="text-text-3"> · sim</span>}
                        {c.zoneId && <span className="text-text-3"> · {state?.zones.find((z) => z.id === c.zoneId)?.name}</span>}
                      </span>
                      <span className={cx("rounded px-1.5 text-[11px]", load ? "bg-claimed-soft text-claimed" : "text-text-3")} title="Requests they own right now">
                        {load ? `${load} active` : "free"}
                      </span>
                      {!c.isSimulated && (
                        <button onClick={() => setDmPeer(c)} aria-label={`Message ${c.name}`} className="grid size-7 place-items-center rounded-md text-text-3 hover:bg-surface-2 hover:text-text">
                          <MessageCircle className="size-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="msg-h">
            <h2 id="msg-h" className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-text-2">
              <MessageCircle className="size-4" aria-hidden /> Messages
              {dms.unread > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">{dms.unread}</span>}
            </h2>
            {connected ? <Inbox threads={dms.threads} crew={state?.crew ?? []} meId={state?.me?.nexconnUserId ?? null} now={now} onOpen={setDmPeer} /> : <p className="text-[13px] text-text-3">Connecting to messaging…</p>}
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 text-sm">
            <h2 className="text-[13px] font-semibold text-text-2">Invite the crew</h2>
            <CopyLine path={`/join/${crewCode}`} />
            <h2 className="mt-3 text-[13px] font-semibold text-text-2">Attendee help page</h2>
            <CopyLine path={`/e/${slug}`} />
          </section>
        </aside>
      </div>

      {state && open && (
        <IncidentDetail
          eventId={eventId}
          incident={open}
          crew={state.crew}
          me={state.me}
          isLead
          as="organizer"
          now={now}
          connected={connected}
          flashAt={flash[open.id]}
          onPatch={patchIncident}
          onRefresh={refresh}
          onClose={() => setOpenId(null)}
        />
      )}
      {state && dmPeer && (
        <Sheet
          onClose={() => {
            setDmPeer(null);
            dms.refresh();
          }}
          title={dmPeer.name}
        >
          <div className="flex h-full min-h-[60dvh] flex-col lg:min-h-full">
            <DirectThread peerUserId={dmPeer.nexconnUserId} peerName={dmPeer.name} meUserId={state.me?.nexconnUserId ?? null} connected={connected} onActivity={dms.refresh} />
          </div>
        </Sheet>
      )}
    </div>
  );
}

function HeaderLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm hover:border-text/40">
      {icon} {children}
    </Link>
  );
}

function Kpi({ label, value, tone, hint }: { label: string; value: string | number; tone?: "open" | "urgent"; hint?: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-text-3">{label}</p>
      <p className={cx("mt-1 font-serif text-[34px] leading-none font-normal tabular-nums", tone === "open" && "text-open", tone === "urgent" && "text-urgent")}>{value}</p>
      {hint && <p className="text-[11px] text-text-3">{hint}</p>}
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
      aria-label={`Copy link ${url}`}
    >
      <span className="flex-1 truncate">{url}</span>
      {copied ? "Copied" : <Copy className="size-3.5" aria-hidden />}
    </button>
  );
}
